from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os, base64, cv2
from datetime import datetime
from ultralytics import YOLO

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

peer_ids = set()
model = YOLO("yolov8m.pt")  # COCO-pretrained model

# Extended suspicious classes
SUSPICIOUS_CLASSES = {"cell phone", "laptop", "book", 'mobile phone'}

# Load OpenCV's built-in face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


@app.route("/exam")
def exam():
    return render_template("exam.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/store-peer-id", methods=["POST"])
def store_peer_id():
    data = request.json
    peer_id = data.get("peerId")
    if peer_id and peer_id not in peer_ids:
        peer_ids.add(peer_id)
        return jsonify({"message": "Peer ID stored", "peerId": peer_id})
    return jsonify({"message": "Peer ID missing or duplicate"}), 400


@app.route("/get-peer-ids")
def get_peer_ids():
    return jsonify(list(peer_ids))


@app.route("/delete-peer-id", methods=["POST"])
def delete_peer_id():
    data = request.json
    peer_id = data.get("peerId")
    if peer_id and peer_id in peer_ids:
        peer_ids.remove(peer_id)
        return jsonify({"message": "Peer ID deleted", "peerId": peer_id})
    return jsonify({"message": "Peer ID not found"}), 404


@app.route("/upload-screenshot", methods=["POST"])
def upload_screenshot():
    data = request.json
    image_data = data.get("image")

    if image_data:
        image_data = image_data.split(",")[1]
        screenshots_folder = os.path.join(app.static_folder, "screenshots")
        os.makedirs(screenshots_folder, exist_ok=True)

        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.png"
        image_path = os.path.join(screenshots_folder, filename)

        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_data))

        frame = cv2.imread(image_path)
        if frame is None:
            return jsonify({"message": "Failed to read image"}), 400

        suspicious = False
        reasons = []

        # YOLO detection
        results = model(frame, verbose=False)
        person_count = 0

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                conf = float(box.conf[0])

                # Count persons
                if label == "person" and conf > 0.5:
                    person_count += 1

                # Flag suspicious objects
                if label in SUSPICIOUS_CLASSES and conf > 0.5:
                    suspicious = True
                    reasons.append(f"{label} detected")

                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    cv2.rectangle(frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), (0, 0, 255), 2)
                    cv2.putText(frame, label, (xyxy[0], xyxy[1] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Person count check
        if person_count > 1:
            suspicious = True
            reasons.append("Multiple people detected")

        # Face detection using Haar cascades
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            suspicious = True
            reasons.append("No face detected")
        else:
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

        # Brightness detection (simple method)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        brightness = hsv[:, :, 2].mean()
        if brightness > 200:
            suspicious = True
            reasons.append("High brightness - possible screen reflection")

        if suspicious:
            cv2.imwrite(image_path, frame)
            return jsonify({
                "message": "Suspicious activity detected",
                "filename": f"/static/screenshots/{filename}",
                "reasons": reasons
            })
        else:
            os.remove(image_path)
            return jsonify({"message": "No suspicion detected. Screenshot deleted."})

    return jsonify({"message": "No image data received"}), 400


@app.route("/view_screenshots")
def view_screenshots():
    screenshots_folder = os.path.join(app.static_folder, "screenshots")
    os.makedirs(screenshots_folder, exist_ok=True)
    files = os.listdir(screenshots_folder)
    images = [f"/static/screenshots/{file}" for file in files if file.endswith(".png")]

    html = "<h1>Suspicious Screenshots</h1><div style='display:flex; flex-wrap: wrap;'>"
    for img in images:
        html += f'''
        <div style="margin: 10px;">
            <img src="{img}" width="300" style="border:1px solid #ccc;"/><br>
            <p>{img}</p>
        </div>
        '''
    html += "</div>"
    return html


if __name__ == "__main__":
    app.run(debug=True)
