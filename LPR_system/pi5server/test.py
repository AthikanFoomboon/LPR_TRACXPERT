import cv2
import numpy as np

def reorder_points(pts):
    """
    จัดเรียงจุดในลำดับ: top-left, top-right, bottom-right, bottom-left
    """
    rect = np.zeros((4, 2), dtype="float32")
    # ผลรวมของพิกัด: จุดที่มีค่าน้อยสุดคือ top-left, มากสุดคือ bottom-right
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # ผลต่างของพิกัด: จุดที่มีค่าน้อยสุดคือ top-right, มากสุดคือ bottom-left
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect

# โหลดภาพ
image = cv2.imread('/Users/athikan/Downloads/snapshots (3)/stream2_20241206104259057Z.jpg')
if image is None:
    raise ValueError("ไม่พบไฟล์ภาพ")

# เปลี่ยนเป็น grayscale และทำ Gaussian Blur
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (5, 5), 0)

# ตรวจจับขอบด้วย Canny
edged = cv2.Canny(blur, 50, 150)

# หาคอนทัวร์ในภาพ
contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# จัดเรียงคอนทัวร์ตามพื้นที่ (มากไปน้อย)
contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

plateContour = None

# ค้นหาคอนทัวร์ที่มี 4 มุม ซึ่งคาดว่าจะเป็นป้ายทะเบียน
for c in contours:
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.02 * peri, True)
    if len(approx) == 4:
        plateContour = approx
        break

if plateContour is None:
    print("ไม่พบป้ายทะเบียน")
else:
    # วาดคอนทัวร์ที่ตรวจพบลงบนภาพต้นฉบับ (เพื่อแสดงผล)
    cv2.drawContours(image, [plateContour], -1, (0, 255, 0), 3)

    # แปลงข้อมูลมุมให้เป็น array ของ shape (4,2)
    pts = plateContour.reshape(4, 2)
    rect = reorder_points(pts)

    # คำนวณความกว้างและความสูงของป้ายใหม่
    (tl, tr, br, bl) = rect
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = max(int(heightA), int(heightB))

    # กำหนดจุดปลายทางของการแปลง perspective
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    # คำนวณเมทริกซ์การแปลง perspective และทำการ warp
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    # แสดงผลลัพธ์
    cv2.imshow("Original Image", image)
    cv2.imshow("Warped (Plate)", warped)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
