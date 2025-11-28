from ultralytics import YOLO

# Load YOLO model once
model = YOLO("yolov8s.pt")

SUSPICIOUS_CLASSES = {"cell phone", "laptop", "book", "mobile phone"}

def run_yolo(frame):
    results = model(frame, verbose=False)
    detections = []
    person_count = 0

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])

            # Count persons
            if label == "person" and conf > 0.5:
                person_count += 1

            # Suspicious object detected
            if label in SUSPICIOUS_CLASSES and conf > 0.5:
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                detections.append((label, conf, xyxy))

    return person_count, detections
