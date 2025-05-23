# 🛡️ AI Proctoring System (Flask + YOLOv8)

An AI-powered proctoring web app using Flask, OpenCV, and Ultralytics YOLOv8. It captures screenshots from a student’s browser, uses YOLO to detect suspicious behavior (e.g., multiple persons, phones), and uploads flagged images to Database.

---

## 📦 Features

- Real-time screenshots sent from frontend
- Detection using YOLOv8 for suspicious activity (`cell phone`, etc.)
- Automatically discards clear screenshots
- Uploads suspicious screenshots to Cloudinary
- Flask dashboard to review saved images
- WebRTC-based PeerJS integration for live camera feeds

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/MustafaNazir11/ASEP-2.git
cd ASEP-2
```


### 2. Create virtual environment
```bash
python -m venv venv
```
#### On Windows:
```
venv\Scripts\activate
```
#### On macOS/Linux:
```
source venv/bin/activate
```
### 3. Install Packages
```
pip install flask flask-cors opencv-python ultralytics
```

### 4. Run the program 

```
python app.py
```
### 5. Go to the browser and open this link
```
127.0.0.1:5000/exam
```
#### To view screenshot of cheating detected
```
127.0.0.1:5000/screenshots
```
