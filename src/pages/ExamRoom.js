import React from 'react';
import '../styles/ExamRoom.css';



const ExamPage = () => {
  const handleStartExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('Access granted to camera and microphone');

      // You can now pass `stream` to a video element or WebRTC logic
      // For demo, attach to a hidden video element:
      const videoElement = document.getElementById('exam-video');
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }

    } catch (error) {
      console.error('Permission denied or error accessing media devices:', error);
      alert('Camera and microphone access is required to take the exam.');
    }
  };

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h1>Exam Center</h1>
        <p>Prepare for your next exam.</p>
      </div>
      <div className="exam-info">
        <h2>Mathematics Exam</h2>
        <p><strong>Duration:</strong> 2 hours</p>
        <p><strong>Questions:</strong> 50</p>
        <p><strong>Proctoring:</strong> Enabled</p>
      </div>
      <button className="exam-button" onClick={handleStartExam}>
        Start Exam
      </button>

      {/* Hidden video for testing webcam access */}
      <video id="exam-video" width="300" height="200" style={{ display: 'none' }} muted></video>
    </div>
  );
};

export default ExamPage;
