import cv2
import numpy as np
import logging
import os

# ตั้งค่า Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def convertImage(image):
    """
    แปลงภาพเป็น grayscale, blur, ตรวจจับขอบด้วย Canny และแปลงเป็น Binary ด้วย Otsu thresholding
    จากนั้นรวมผลลัพธ์ทั้งสองเพื่อเน้นพื้นที่ที่มีความต่างของชั้นสีสูง
    """
    if image is None or not hasattr(image, "shape"):
        raise ValueError("Invalid image input")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)         # แปลงภาพเป็นเกรย์สเกล
    blur = cv2.GaussianBlur(gray, (5, 5), 0)                # เบลอภาพเพื่อลด noise
    canny = cv2.Canny(blur, 100, 200)                       # ตรวจจับขอบด้วย Canny

    # ใช้ Otsu thresholding เพื่อหาพื้นที่ที่มีความต่างของสีสูง
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # รวมผลลัพธ์ของ canny และ thresh เพื่อเน้นพื้นที่ high contrast
    combined = cv2.bitwise_or(canny, thresh)
    return combined


def calculate_angle(line):
    """
    คำนวณมุมของเส้นกับแกน X (ผลลัพธ์อยู่ในช่วง [0,180))
    """
    x1, y1, x2, y2 = line
    if x1 == x2:  # กรณีเส้นแนวตั้ง
        return 90.0
    angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
    return abs(angle) % 180


def find_intersection(line1, line2, image_shape):
    """
    คำนวณจุดตัดของสองเส้น (ถ้าอยู่ภายในขอบเขตของภาพ)
    
    Parameters:
        line1, line2: (x1, y1, x2, y2)
        image_shape: (height, width, ...)
    
    Returns:
        (x, y) เป็นจุดตัด (integer) หรือ None หากเส้นขนานหรือจุดตัดอยู่นอกภาพ
    """
    try:
        x1, y1, x2, y2 = line1
        x3, y3, x4, y4 = line2

        denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if np.isclose(denominator, 0):
            return None

        det1 = x1 * y2 - y1 * x2
        det2 = x3 * y4 - y3 * x4

        x_int = (det1 * (x3 - x4) - (x1 - x2) * det2) / denominator
        y_int = (det1 * (y3 - y4) - (y1 - y2) * det2) / denominator

        height, width = image_shape[:2]
        if 0 <= x_int <= width and 0 <= y_int <= height:
            return (int(round(x_int)), int(round(y_int)))
        return None

    except Exception as e:
        logging.error(f"Error in find_intersection: {e}")
        return None


def group_intersections(intersections, distance_threshold=10):
    """
    จัดกลุ่มจุดตัดที่อยู่ใกล้กัน โดยใช้ Euclidean distance ในการตรวจสอบ
    
    Parameters:
        intersections: list of (x, y)
        distance_threshold: ระยะห่างสูงสุดในการจัดกลุ่ม
        
    Returns:
        กลับมาเป็น list ของจุดศูนย์กลาง (mean) ของแต่ละกลุ่ม (สูงสุด 4 กลุ่ม)
    """
    if not intersections or not isinstance(distance_threshold, (int, float)):
        raise ValueError("Invalid input: intersections must be a list and distance_threshold must be a number")

    # กรองเฉพาะค่าที่เป็น tuple/list 2 ค่า
    valid_intersections = [p for p in intersections if isinstance(p, (tuple, list)) and len(p) == 2]
    if not valid_intersections:
        return []

    valid_intersections = np.array(valid_intersections, dtype=np.float32)
    n_points = len(valid_intersections)
    used = np.zeros(n_points, dtype=bool)
    grouped = []

    for i in range(n_points):
        if used[i]:
            continue
        # คำนวณระยะห่างจากจุดที่ i ไปยังจุดอื่นๆ แบบ vectorized
        diff = valid_intersections - valid_intersections[i]
        distances = np.sqrt(np.sum(diff**2, axis=1))
        # ดัชนีที่อยู่ในระยะ threshold (รวมจุดที่ i ด้วย)
        group_indices = np.where(distances < distance_threshold)[0]
        used[group_indices] = True
        group_points = valid_intersections[group_indices]
        mean_point = np.mean(group_points, axis=0)
        grouped.append((int(round(mean_point[0])), int(round(mean_point[1]))))

    return grouped[:4]  # จำกัดจำนวนกลุ่มสูงสุด 4 กลุ่ม


def detect_intersections(image, lines, angle_threshold=30, distance_threshold=50):
    """
    ตรวจจับจุดตัดระหว่างเส้น โดยกรองจากความแตกต่างของมุม (angle)
    
    Returns:
        image ที่ไม่เปลี่ยนแปลง และ list จุดตัดที่จัดกลุ่มแล้ว
    """
    if not lines:
        return image, []

    intersections = []
    n_lines = len(lines)
    for i in range(n_lines):
        for j in range(i + 1, n_lines):
            # ตรวจสอบความแตกต่างของมุมระหว่างเส้นทั้งสอง
            angle_diff = abs(calculate_angle(lines[i][0]) - calculate_angle(lines[j][0]))
            if angle_diff >= angle_threshold:
                intersection = find_intersection(lines[i][0], lines[j][0], image.shape)
                if intersection is not None:
                    intersections.append(intersection)
    grouped_intersections = group_intersections(intersections, distance_threshold)
    return image, grouped_intersections


def shrink_contour(contour, shrink_pixels):
    """
    ลดขนาด contour โดยเลื่อนจุดแต่ละจุดเข้าไปจากจุดศูนย์กลาง
    หากระยะจากจุดศูนย์กลางมากกว่า shrink_pixels จึงทำการย่อ
    """
    M = cv2.moments(contour)
    if M["m00"] == 0:
        return contour

    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    new_points = []

    for point in contour:
        x, y = point[0]
        dx, dy = x - cx, y - cy
        distance = np.hypot(dx, dy)
        if distance > shrink_pixels:
            factor = (distance - shrink_pixels) / distance
            new_x = int(cx + dx * factor)
            new_y = int(cy + dy * factor)
            new_points.append([[new_x, new_y]])
        else:
            new_points.append(point)
    return np.array(new_points)


def detect_edges_and_draw_lines(img, edge_threshold=(50, 100), hough_params=(30, 40, 10),
                                rectangularity_threshold=0.5, min_contour_area=1000):
    """
    ตรวจจับขอบ, เส้น และจุดตัดในภาพ พร้อมวาดผลลัพธ์
    โดยคัดกรองเฉพาะ contour ที่ดีที่สุดที่มีลักษณะใกล้เคียงกับสี่เหลี่ยม
    """
    try:
        processed_img = convertImage(img)
    except Exception as e:
        logging.error(f"convertImage failed: {e}")
        return img

    original_img = img.copy()

    # ค้นหา contour
    contours_data = cv2.findContours(processed_img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours_data[0] if len(contours_data) == 2 else contours_data[1]
    if not contours:
        logging.warning("No contours found.")
        return img, []

    # เลือกเฉพาะ contour ที่ผ่านเงื่อนไขพื้นที่และ rectangularity
    valid_contours = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_contour_area:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        if w <= 0 or h <= 0:
            continue
        rectangularity = area / (w * h)
        if rectangularity >= rectangularity_threshold:
            valid_contours.append((contour, area, rectangularity))

    if not valid_contours:
        logging.warning("No valid contours found meeting criteria.")
        return img, []

    # ========= เริ่มการปรับปรุงการตรวจจับสี่เหลี่ยม =========
    # ค้นหา contour ที่ approximate แล้วมี 4 จุด (สี่เหลี่ยม)
    quad_contours = []
    for contour, area, rect in valid_contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) == 4:
            quad_contours.append((approx, area, rect))
    
    if quad_contours:
        # ถ้ามีสี่เหลี่ยม candidate เลือกอันที่ดีที่สุดโดยพิจารณาจาก rectangularityและพื้นที่
        quad_contours = sorted(quad_contours, key=lambda x: (x[2], x[1]), reverse=True)
        best_quad = quad_contours[0][0]
    else:
        # หากไม่พบสี่เหลี่ยมที่ชัดเจน fallback ไปใช้ contour ที่ดีที่สุดจาก valid_contours
        valid_contours = sorted(valid_contours, key=lambda x: (x[2], x[1]), reverse=True)
        best_contour = valid_contours[0][0]
        peri = cv2.arcLength(best_contour, True)
        best_quad = cv2.approxPolyDP(best_contour, 0.02 * peri, True)
    # =========================================================

    # ลดขนาด contour ด้วยฟังก์ชัน shrink_contour
    shrunk_contour = shrink_contour(best_quad, shrink_pixels=10)
    # วาด contour ที่ดีที่สุดลงบนภาพ
    cv2.drawContours(original_img, [shrunk_contour], -1, (0, 255, 155), 2)

    # กำหนด shrunk_contours เป็น list ที่มีเพียง contour ที่ดีที่สุด
    shrunk_contours = [shrunk_contour]

    # ตรวจจับเส้นจาก Canny และ Hough Transform
    edges = cv2.Canny(processed_img, edge_threshold[0], edge_threshold[1])
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, hough_params[0],
                            minLineLength=hough_params[1], maxLineGap=hough_params[2])
    if lines is None:
        logging.warning("No lines detected by Hough Transform.")
        return img, []

    lines_to_process = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        line_center = (int((x1 + x2) / 2), int((y1 + y2) / 2))
        inside_any = False
        # ตรวจสอบว่าเส้นอยู่ภายใน contour ที่ดีที่สุดหรือไม่
        for shrunk_contour in shrunk_contours:
            if cv2.pointPolygonTest(shrunk_contour, line_center, False) >= 0:
                inside_any = True
                break
        if not inside_any:
            lines_to_process.append(line)
            cv2.line(original_img, (x1, y1), (x2, y2), (5, 90, 255), 1)

    image_with_intersections, intersections = detect_intersections(original_img, lines_to_process)
    for x, y in intersections:
        cv2.circle(image_with_intersections, (x, y), 10, (34, 22, 255), -1)

    output_path = 'output_image.png'
    try:
        cv2.imwrite(output_path, image_with_intersections)
        logging.info(f"Output saved to {output_path}")
    except Exception as e:
        logging.error(f"Failed to save output image: {e}")

    return image_with_intersections


if __name__ == "__main__":
    try:
        image_path = '/Users/athikan/Downloads/cropped_plates/cropped_stream2_20241208042640921Z_0.jpg'
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        final_image = detect_edges_and_draw_lines(img)
        cv2.imshow('Processed Image', final_image)
        cv2.waitKey(0)
    except Exception as e:
        logging.error(f"Error occurred: {e}")
    finally:
        cv2.destroyAllWindows()
