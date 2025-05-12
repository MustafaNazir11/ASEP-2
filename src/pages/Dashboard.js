import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importing useNavigate hook
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to handle Start New Exam button click
  const handleStartNewExam = () => {
    navigate('/exam'); // Redirect to the ExamPage
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome, User! Here's your overview.</p>
      </div>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Exams Taken</h3>
          <p className="stat">5</p>
        </div>
        <div className="dashboard-card">
          <h3>Average Score</h3>
          <p className="stat">85%</p>
        </div>
        <div className="dashboard-card">
          <h3>Upcoming Exams</h3>
          <p className="stat">2</p>
        </div>
      </div>
      <button className="dashboard-button" onClick={handleStartNewExam}>
        Start New Exam
      </button>
    </div>
  );
};

export default DashboardPage;
