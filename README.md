# 🛡️ AI Based Exam Proctoring System (Flask + YOLOv8 + MediaPipe)

An AI-powered online exam proctoring web application using Flask, OpenCV, YOLOv8, and MediaPipe.  
It captures real-time screenshots from a student’s browser, detects suspicious behavior (multiple people, phone usage, unusual gaze), and uploads flagged images to Cloudinary. Teachers can monitor exams through a Flask dashboard.

---

## 📦 Features

- Student and Teacher login & registration
- Admin dashboard for exam monitoring
- Real-time screenshots sent from student browser
- Detection using YOLOv8 for suspicious activity (cell phone, multiple people)
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

` git clone https://github.com/MustafaNazir11/AI-Exam-Proctoring-System.git `

```cd AI-Exam-Proctoring-System```

### 2. Create a Virtual Environment for Python version 3.10.7 
```python3.10 -m venv venv```

#### On Windows:
```venv\Scripts\activate```

#### On macOS/Linux:
```source venv/bin/activate```

### 3. Install Dependencies

```pip install -r requirements.txt```

```pip uninstall torch torchvision torchaudio -y```

```pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1```

### 4. Run the Application
```python app.py```

### 5. Open in Browser
Login page: http://127.0.0.1:5000/


# 🛠️ Default Accounts
Student: (Register one yourself 😉)

Teacher/Admin: teacher@test.com / admin123



### Feel free to raise any issue if u find one.

