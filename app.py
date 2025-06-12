from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
import os, base64, cv2
from datetime import datetime
from ultralytics import YOLO
import cloudinary
import cloudinary.uploader

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Configure Cloudinary
cloudinary.config(
    cloud_name="dmbhhqmxf",
    api_key="267234471199724",
    api_secret="hZc5Bh9SR7LSL4Fy3tNAZsOhDbY",
)

peer_ids = set()
violation_counts = {}      # Count of violations per peer
violation_logs = []        # List of all violation logs
model = YOLO("yolov8m.pt") # Pretrained YOLO model

SUSPICIOUS_CLASSES = {"cell phone", "laptop", "book", "mobile phone"}
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

@app.route("/")
def index():
    return redirect(url_for("login"))

@app.route("/exam")
def exam():
    return render_template("exam.html")

@app.route("/input-questions")
def input_questions():
    return render_template("questions.html")
@app.route("/test")
def test():
    return render_template("test.html")
@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/admin")
def admin():
    return render_template("admin-dashboard.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/quiz")
def quiz():
    return render_template("students.html")

@app.route("/violations")
def show_violations():
    print("Violation Logs >>>", violation_logs)
    return render_template("violations.html", logs=violation_logs)

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

@app.route("/get-violation-counts")
def get_violation_counts():
    return jsonify(violation_counts)

@app.route("/delete-peer-id", methods=["POST"])
def delete_peer_id():
    data = request.json
    peer_id = data.get("peerId")
    if peer_id and peer_id in peer_ids:
        peer_ids.remove(peer_id)
        violation_counts.pop(peer_id, None)
        return jsonify({"message": "Peer ID deleted", "peerId": peer_id})
    return jsonify({"message": "Peer ID not found"}), 404

@app.route("/upload-screenshot", methods=["POST"])
def upload_screenshot():
    data = request.json
    image_data = data.get("image")
    peer_id = data.get("peerId")

    if not peer_id:
        return jsonify({"message": "Peer ID missing"}), 400

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

        print("📸 Running YOLO model...")
        results = model(frame, verbose=False)
        person_count = 0

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                conf = float(box.conf[0])

                if label == "person" and conf > 0.5:
                    person_count += 1

                if label in SUSPICIOUS_CLASSES and conf > 0.5:
                    suspicious = True
                    reasons.append(f"{label} detected")
                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    cv2.rectangle(frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), (0, 0, 255), 2)
                    cv2.putText(frame, label, (xyxy[0], xyxy[1] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        if person_count > 1:
            suspicious = True
            reasons.append("Multiple people detected")

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            suspicious = True
            reasons.append("No face detected")
        else:
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        brightness = hsv[:, :, 2].mean()
        if brightness > 200:
            suspicious = True
            reasons.append("High brightness - possible screen reflection")

        if suspicious:
            print(f"🚨 Violation by {peer_id}: {reasons}")
            violation_counts[peer_id] = violation_counts.get(peer_id, 0) + 1

            # ✅ Add to log
            violation_logs.append({
                "peer_id": peer_id,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "reasons": reasons
            })

            # Save frame with violation highlights
            cv2.imwrite(image_path, frame)

            try:
                upload_result = cloudinary.uploader.upload(image_path, folder="exam_proctoring")
                os.remove(image_path)

                response = {
                    "message": "Suspicious activity detected",
                    "cloudinary_url": upload_result.get("secure_url"),
                    "public_id": upload_result.get("public_id"),
                    "reasons": reasons
                }

                if violation_counts[peer_id] >= 5:
                    response["action"] = "stop_exam"

                return jsonify(response)
            except Exception as e:
                print(f"❌ Cloudinary upload failed: {e}")
                return jsonify({
                    "message": "Suspicious activity detected, but upload to Cloudinary failed",
                    "error": str(e),
                    "reasons": reasons
                }), 500
        else:
            print(f"✅ No violation for {peer_id}")
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
