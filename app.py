from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import os, base64, cv2, sqlite3
from datetime import datetime
from collections import deque
from ultralytics import YOLO
import cloudinary
import cloudinary.uploader

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# 🔧 DB Initialization for Quiz
def init_db():
    conn = sqlite3.connect('Database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            correct_option TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Add test users
    cursor.execute("INSERT OR IGNORE INTO students (email, password) VALUES (?, ?)", ("student@test.com", "password"))
    cursor.execute("INSERT OR IGNORE INTO teachers (email, password) VALUES (?, ?)", ("teacher@test.com", "admin123"))
    
    conn.commit()
    conn.close()
app.secret_key = "super_secret_key_123"  # Required for session cookies

def get_db_connection():
    conn = sqlite3.connect('Database.db')
    conn.row_factory = sqlite3.Row
    return conn


# 🌩️ Configure Cloudinary
cloudinary.config(
    cloud_name="dmbhhqmxf",
    api_key="267234471199724",
    api_secret="hZc5Bh9SR7LSL4Fy3tNAZsOhDbY",
)

# 👁️‍🗨️ YOLO + Violation Variables
peer_ids = set()
violation_counts = {}
violation_logs = []
model = YOLO("yolov8m.pt")
SUSPICIOUS_CLASSES = {"cell phone", "laptop", "book", "mobile phone"}
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# 📋 Routes
@app.route("/")
def index():
    return redirect(url_for("login"))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        student = conn.execute("SELECT * FROM students WHERE email=? AND password=?", (email, password)).fetchone()
        
        if student:
            session['user_id'] = student['id']
            session['email'] = student['email']
            session['user_type'] = 'student'
            conn.close()
            return redirect(url_for('exam'))
        
        conn.close()
        return "Invalid credentials"

    return render_template('login.html')

# 🧾 STUDENT REGISTER PAGE & INSERT DATA
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        try:
            conn.execute("INSERT INTO students (email, password) VALUES (?, ?)", (email, password))
            conn.commit()
            conn.close()
            return redirect(url_for('login'))
        except:
            conn.close()
            return "❌ Email already exists! Try another."

    return render_template('register.html')

@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        teacher = conn.execute("SELECT * FROM teachers WHERE email=? AND password=?", (email, password)).fetchone()
        
        if teacher:
            session['user_id'] = teacher['id']
            session['email'] = teacher['email']
            session['user_type'] = 'teacher'
            conn.close()
            return redirect(url_for('admin'))
        
        conn.close()
        return "Invalid credentials"

    return render_template('admin-login.html')

@app.route("/admin")
def admin():
    return render_template("admin-dashboard.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

@app.route("/adminprofile")
def adminprofile():
    return render_template("adminprofile.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/exam")
def exam():
    return render_template("exam.html")

@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/violations")
def show_violations():
    return render_template("violations.html", logs=violation_logs)

# 🧠 QUIZ: Add Questions
@app.route("/input-questions", methods=['GET', 'POST'])
def input_questions():
    if request.method == 'POST':
        questions = request.form.getlist('question')
        option_as = request.form.getlist('option_a')
        option_bs = request.form.getlist('option_b')
        option_cs = request.form.getlist('option_c')
        option_ds = request.form.getlist('option_d')
        correct_options = request.form.getlist('correct_option')

        conn = sqlite3.connect('Database.db')
        cursor = conn.cursor()
        
        count = 0
        for i in range(len(questions)):
            if questions[i].strip():  # Only insert non-empty questions
                cursor.execute('''
                    INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_option)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (questions[i], option_as[i], option_bs[i], option_cs[i], option_ds[i], correct_options[i]))
                count += 1
        
        conn.commit()
        conn.close()
        return f"✅ {count} questions added successfully!"

    return render_template('questions.html')

# 🧠 QUIZ: View Questions
@app.route("/quiz")
def quiz():
    conn = sqlite3.connect('Database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions")
    questions = cursor.fetchall()
    conn.close()
    return render_template("students.html", questions=questions)

# 🧠 QUIZ: Submit Answers
@app.route("/submit", methods=['POST'])
def submit():
    submitted_answers = request.form
    conn = sqlite3.connect('Database.db')
    cursor = conn.cursor()

    score = 0
    total = 0

    for key, selected_option in submitted_answers.items():
        if key.startswith('question_'):
            q_id = key.split('_')[1]
            cursor.execute("SELECT correct_option FROM questions WHERE id=?", (q_id,))
            correct_option = cursor.fetchone()[0]
            total += 1
            if selected_option.lower() == correct_option.lower():
                score += 1

    conn.close()

    percentage = (score / total) * 100 if total > 0 else 0
    return render_template("results.html", score=score, total=total, percentage=percentage, message="")

# 📷 Proctoring: Screenshot Upload
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
            violation_counts[peer_id] = violation_counts.get(peer_id, 0) + 1
            violation_logs.append({
                "peer_id": peer_id,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "reasons": reasons
            })

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
                return jsonify({
                    "message": "Suspicious activity detected, but upload failed",
                    "error": str(e),
                    "reasons": reasons
                }), 500
        else:
            os.remove(image_path)
            return jsonify({"message": "No suspicion detected. Screenshot deleted."})

    return jsonify({"message": "No image data received"}), 400

# 📡 Peer ID Handling
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
        violation_counts.pop(peer_id, None)
        return jsonify({"message": "Peer ID deleted", "peerId": peer_id})
    return jsonify({"message": "Peer ID not found"}), 404

# 📸 View Saved Screenshots
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

# 🚀 Start the App
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
