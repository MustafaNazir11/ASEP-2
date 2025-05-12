import React from 'react';
import '../styles/Dashboard.css';

const DashboardPage = () => {
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
      <button className="dashboard-button">Start New Exam</button>
    </div>
  );
};

export default DashboardPage;