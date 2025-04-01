import asyncio
import os
import re
import base64
from datetime import datetime
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel
from fast_alpr import ALPR
from typing import Optional, List, Dict
import cv2


app = FastAPI()

output_path = "snapshots"
output_path_error = "erorrImage"
os.makedirs(output_path, exist_ok=True)
os.makedirs(output_path_error, exist_ok=True)

# Load the ALPR model once during application startup
alpr = ALPR(
    detector_model="yolo-v9-t-384-license-plate-end2end",
    ocr_model="global-plates-mobile-vit-v2-model"
)

async def read_license_plate(image_path: str) -> List[Dict]:
    plates = []
    
    try:
        image = Image.open(image_path)
        # Process the image asynchronously
        result = await asyncio.to_thread(alpr.predict, image_path)
    
        
        if not result:
            return {"message": "No license plates detected."}

        for idx, det in enumerate(result):
            bbox = det.detection.bounding_box
            x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)

            # Validate bounding box coordinates
            width, height = image.size
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(width, x2), min(height, y2)

            if x2 <= x1 or y2 <= y1:
                print(f"Invalid bbox coordinates: {bbox}")
                continue

            # Crop the license plate
            cropped_image = image.crop((x1, y1, x2, y2))

            cropped_dir = os.path.join("server", "photoYoLo")
            os.makedirs(cropped_dir, exist_ok=True)
            cropped_filename = f"cropped_plate_{idx}_{os.path.basename(image_path)}"
            cropped_path = os.path.join(cropped_dir, cropped_filename)
            cropped_image.save(cropped_path)
        
            if det.ocr and det.ocr.text:
                # เก็บเลขมากสุด 4 ตัวสุดท้าย
                last_four = det.ocr.text[-4:] if len(det.ocr.text) >= 4 else det.ocr.text

                with open(image_path, "rb") as image_file:
                    full_image_encoded = base64.b64encode(image_file.read()).decode('utf-8')

                with open(cropped_path, "rb") as cropped_file:
                    crop_image_encoded = base64.b64encode(cropped_file.read()).decode('utf-8')

                plates.append({
                    "fullFrame": full_image_encoded,
                    "crops": crop_image_encoded,
                    "confidence": det.ocr.confidence,
                    "alpr_results_digits": last_four,
                    "ocr_results": det.ocr.text
                })

                print('---------------')
                print('License Plate: ', last_four)
                print('Confidence: ', det.ocr.confidence)
                print('Confidence: ', det)
                print('---------------')

        if(det.ocr.confidence>0.80):
            return plates 
        else:
            return None
    
    except Exception as e:
        return {"message": f"Error processing image: {str(e)}"}

class YoloData(BaseModel):
    streamId: str
    rtspURL: str

@app.post("/snapCamera/yolo")
async def snap_camera_yolo(data: YoloData):
    print(f"RTSP URL: {data.rtspURL}")
  
    rtsp_url = data.rtspURL

    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        return {"message": "Unable to connect to RTSP stream."}
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return {"message": "Unable to read frame from RTSP stream."}

    image_filename = os.path.join(output_path, f"frame_{data.streamId}.jpg")
    cv2.imwrite(image_filename, frame)

    plates = await read_license_plate(image_filename)
        
    if(plates == None ):
      image = Image.open(image_filename)
      timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
      new_image_path = os.path.join(output_path_error, f"frame{timestamp}_{data.streamId}.jpg")
      image.save(new_image_path)
      
      print(f"Image saved to: {new_image_path}")

    return {"plates": plates}
