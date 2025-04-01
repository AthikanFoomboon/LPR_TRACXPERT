import os
import cv2
import asyncio
import logging
from typing import List, Dict
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import numpy as np
from fast_alpr import ALPR
from controller.Perspective import detect_edges_and_draw_lines

app = FastAPI()

# กำหนดโฟลเดอร์การจัดเก็บ
output_fullframe = "fullframe"
output_perspective = "perspective"
output_path_error = "errorImage"

os.makedirs(output_fullframe, exist_ok=True)
os.makedirs(output_perspective, exist_ok=True)
os.makedirs(output_path_error, exist_ok=True)

# ตั้งค่าการล็อก
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# โหลดโมเดล ALPR เมื่อแอปพลิเคชันเริ่มต้น
alpr = ALPR()

def adjust_image(image):
    """
    ปรับปรุงภาพโดยปรับความสว่างและความคมชัด
    ด้วยการใช้ CLAHE (Contrast Limited Adaptive Histogram Equalization)
    """
    # แปลงภาพจาก BGR เป็น LAB
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    # ใช้ CLAHE กับ channel ความสว่าง
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    # รวม channel กลับเข้าด้วยกันและแปลงกลับเป็น BGR
    lab = cv2.merge((cl, a, b))
    adjusted = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return adjusted

def expandImg(image, bbox, expand_px=25):
    """
    ขยาย bounding box และ crop ภาพ
    """
    x1, y1, x2, y2 = bbox.x1, bbox.y1, bbox.x2, bbox.y2
    
    # ขยาย bounding box
    x1 = max(0, x1 - expand_px)
    y1 = max(0, y1 - expand_px)
    x2 = min(image.shape[1], x2 + expand_px)
    y2 = min(image.shape[0], y2 + expand_px)
    
    # Crop ภาพ
    cropped_image = image[y1:y2, x1:x2]
    
    return cropped_image

# ฟังก์ชันอ่านป้ายทะเบียนและปรับมุมมองภาพ
async def read_license_plate(image_path: str) -> List[Dict]:
    # อ่านภาพด้วย OpenCV
    image = cv2.imread(image_path)

    if image is None:
        logger.error(f"ไม่สามารถโหลดภาพจาก {image_path}")
        return []

    # ปรับภาพให้เหมาะสมก่อนประมวลผล
    adjusted_fullframe = adjust_image(image)
    # บันทึกภาพที่ปรับแล้วลงในโฟลเดอร์ fullframe ทุกครั้ง
    cv2.imwrite(f"{output_fullframe}/fullframe_image.jpg", adjusted_fullframe)

    # รันการตรวจจับ ALPR โดยใช้ภาพที่ปรับแล้ว
    try:
        alpr_results = alpr.predict(image_path)
        logger.info(f'>>>> ผลลัพธ์ ALPR: {alpr_results}')
    except Exception as e:
        logger.error(f"การประมวลผล ALPR ล้มเหลว: {e}")
        return []

    plates = []
    if not alpr_results:  # หากไม่พบป้ายทะเบียน
        # บันทึกภาพที่ไม่ได้ตรวจพบป้ายทะเบียนใน errorImage
        cv2.imwrite(f"{output_path_error}/error_no_plate_found.jpg", adjusted_fullframe)
        return plates

    for result in alpr_results:
        if result.ocr.text:  # ตรวจสอบว่า OCR มีข้อความ
            # ดึงข้อมูล bounding box
            bbox = result.detection.bounding_box
            # ปรับมุมมองภาพโดยขยาย bounding box ที่ระบุ
            cropped_image = expandImg(adjusted_fullframe, bbox)
            
            if cropped_image is None:
                logger.warning(f"ไม่สามารถปรับมุมมองได้สำหรับ {result.ocr.text}")
                continue  # ข้ามไปหากไม่สามารถปรับมุมมองได้

            # ปรับภาพเพิ่มเติมก่อนส่งเข้าไปในฟังก์ชัน detect_edges_and_draw_lines
            cropped_adjusted = adjust_image(cropped_image)
            
            # เรียกใช้ฟังก์ชันค้นหาจุดจัด (perspective transform)
            try:
                processed_image = detect_edges_and_draw_lines(cropped_adjusted)
            except Exception as e:
                logger.error(f"การประมวลผลภาพล้มเหลวสำหรับ {result.ocr.text}: {e}")
                continue
            
            # เพิ่มข้อมูลของป้ายทะเบียนและความมั่นใจ
            plates.append({
                "plate_number": result.ocr.text,
                "confidence": result.ocr.confidence,
                "pathImage": f"{output_perspective}/{result.ocr.text}_adjusted.jpg"
            })
            # บันทึกภาพที่ปรับมุมมองแล้วในโฟลเดอร์ perspective
            cv2.imwrite(f"{output_perspective}/{result.ocr.text}_adjusted.jpg", processed_image)

    return plates

# ฟังก์ชันที่รันใน main
async def main():
    image_filename =   '/Users/athikan/Downloads/snapshots (3)/stream2_20241206134724794Z.jpg'
    plates = await read_license_plate(image_filename)
    print("Detected Plates:", plates)

# เรียกใช้ main เมื่อรันจาก __main__
if __name__ == "__main__":
    asyncio.run(main())
