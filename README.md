# 🛡️ AI Proctoring System (Flask + YOLOv8 + MediaPipe)

An AI-powered online exam proctoring web application using Flask, OpenCV, YOLOv8, and MediaPipe.  
It captures real-time screenshots from a student’s browser, detects suspicious behavior (multiple people, phone usage, unusual gaze), and uploads flagged images to Cloudinary. Teachers can monitor exams through a Flask dashboard.

---

## 📦 Features

- Student and Teacher login & registration
- Admin dashboard for exam monitoring
- Real-time screenshots sent from student browser
- Detection using YOLOv8 for suspicious activity (`cell phone`, multiple people)
- MediaPipe face mesh + gaze detection to monitor student attention
- Brightness check to detect screen reflections
- Automatically discards non-suspicious screenshots
- Suspicious screenshots uploaded to Cloudinary
- PeerJS integration for live camera feeds
- Violation logs with automatic `stop_exam` after repeated violations
- Quiz management: add questions, take exams, view results

---

## 🚀 Setup Instructions

### 1. Clone the Repository

git clone https://github.com/MustafaNazir11/ASEP-2.git
cd ASEP-2

### 2. Create a Virtual Environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

### 3. Install Dependencies

pip install -r requirements.txt

### 4. Run the Application
python app.py

### 5. Open in Browser
Student Exam Page: http://127.0.0.1:5000/exam

Admin Dashboard: http://127.0.0.1:5000/dashboard

View Suspicious Screenshots: http://127.0.0.1:5000/view_screenshots

# 🛠️ Default Accounts
Student: student@test.com / password

Teacher/Admin: teacher@test.com / admin123

🗂️ Project Structure
pgsql
Copy code
ASEP-2/
├─ app.py
├─ Database.db
├─ requirements.txt
├─ templates/
│   ├─ login.html
│   ├─ register.html
│   ├─ exam.html
│   ├─ dashboard.html
│   └─ admin-dashboard.html
├─ static/
│   ├─ js/
│   ├─ css/
│   └─ screenshots/
├─ utils/
│   ├─ yolo_detector.py
│   ├─ face_detector.py
│   ├─ brightness_check.py
│   ├─ violation_rules.py
│   └─ cloud.py
├─ yolov8s.pt
└─ README.md