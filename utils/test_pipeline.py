import cv2
from yolo_detector import run_yolo
from face_detector import detect_faces
from brightness_check import check_brightness

# Test image path (you can put any local image)
test_image_path = "../static/test.jpg"

frame = cv2.imread(test_image_path)

print("🟦 Testing YOLO...")
person_count, detections = run_yolo(frame)
print("Person Count:", person_count)
print("Detections:", detections)

print("\n🟩 Testing Face Detection...")
faces = detect_faces(frame)
print("Faces:", faces)

print("\n🟨 Testing Brightness...")
brightness = check_brightness(frame)
print("Brightness Level:", brightness)
