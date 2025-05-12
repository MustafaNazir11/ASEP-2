import React, { useState } from 'react';
import '../styles/ExamRoom.css';
import MediaCheckModal from '../components/MediaCheckModal';

const ExamPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const handleMediaCheckComplete = () => {
    setShowModal(false);
    setExamStarted(true);
    // Redirect to exam screen or initialize exam here if needed
  };

  const handleEndExam = () => {
    // Handle end exam logic here (e.g., redirect to results page or show a confirmation)
    alert("The exam has ended. Redirecting to results.");
    setExamStarted(false); // Optionally reset the examStarted state
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

      {!examStarted ? (
        <button className="exam-button" onClick={() => setShowModal(true)}>
          Start Exam
        </button>
      ) : (
        <div>
          <p className="exam-status">The exam has started. Good luck!</p> 
          <button className="end-exam-button" onClick={handleEndExam}>
            End Exam
          </button>
        </div>
      )}

      {showModal && <MediaCheckModal onClose={() => setShowModal(false)} onSuccess={handleMediaCheckComplete} />}
    </div>
  );
};

export default ExamPage;
