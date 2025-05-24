from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os, base64, cv2
from datetime import datetime
from ultralytics import YOLO

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

peer_ids = []

# Load the YOLOv8 model once at startup
model = YOLO("yolov8m.pt")  # Pretrained on COCO

SUSPICIOUS_CLASSES = {"cell phone"}  # Class name from COCO

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

        screenshots_folder = os.path.join(app.static_folder, "screenshots")
        os.makedirs(screenshots_folder, exist_ok=True)

        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        image_path = os.path.join(screenshots_folder, filename)

        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_data))

        frame = cv2.imread(image_path)
        results = model(frame, verbose=False)

        suspicious = False
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                if label in SUSPICIOUS_CLASSES:
                    suspicious = True
                    # Draw bounding box
                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    cv2.rectangle(frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), (0, 0, 255), 2)
                    cv2.putText(frame, label, (xyxy[0], xyxy[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        if suspicious:
            cv2.imwrite(image_path, frame)  # Save image with bounding boxes
            return jsonify({
                "message": "Suspicious activity detected and saved",
                "filename": f"/static/screenshots/{filename}"
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
