from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os, base64, cv2
from datetime import datetime
from ultralytics import YOLO

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

peer_ids = []

# Load the YOLOv8 model once at startup
model = YOLO("yolov8n.pt")  # Use 'yolov8n.pt' or your custom model

SUSPICIOUS_CLASSES = {"cell phone"}  # Adjust based on your use case

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
        peer_ids.append(peer_id)
        return jsonify({"message": "Peer ID stored", "peerId": peer_id})
    return jsonify({"message": "Peer ID missing or duplicate"}), 400

@app.route("/get-peer-ids")
def get_peer_ids():
    return jsonify(peer_ids)

@app.route("/upload-screenshot", methods=["POST"])
def upload_screenshot():
    data = request.json
    image_data = data.get("image")

    if image_data:
        image_data = image_data.split(",")[1]
        screenshots_folder = os.path.join(os.path.dirname(__file__), "screenshots")
        os.makedirs(screenshots_folder, exist_ok=True)

        # Save image in screenshots folder
        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        image_path = os.path.join(screenshots_folder, filename)
        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_data))

        # Load image for YOLO
        frame = cv2.imread(image_path)
        results = model(frame, verbose=False)

        # Check for suspicious classes
        suspicious = False
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for cls_idx in boxes.cls:
                    class_name = model.names[int(cls_idx.item())]
                    if class_name in SUSPICIOUS_CLASSES:
                        suspicious = True
                        break
            if suspicious:
                break

        if suspicious:
            return jsonify({"message": "Suspicious activity detected and saved", "filename": filename})
        else:
            os.remove(image_path)
            return jsonify({"message": "No suspicion detected. Screenshot deleted."})

    return jsonify({"message": "No image data received"}), 400


@app.route("/screenshots")
def view_screenshots():
    screenshot_folder = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(screenshot_folder, exist_ok=True)
    files = os.listdir(screenshot_folder)
    images = [f"/screenshots/{file}" for file in files if file.endswith(".png")]

    html = "<h1>Suspicious Screenshots</h1>"
    for img in images:
        html += f'<div><img src="{img}" width="300"><p>{img}</p></div>'
    return html

@app.route("/screenshots/<path:filename>")
def serve_screenshot_file(filename):
    return send_from_directory("screenshots", filename)

if __name__ == "__main__":
    app.run(debug=True)
