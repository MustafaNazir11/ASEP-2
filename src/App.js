import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ExamPage from './pages/ExamRoom';
import './styles/App.css'; // Optional: For global styles or navigation

function App() {
  return (
    <Router>
      <div className="App">
        {/* Simple Navigation Bar */}
        <nav className="nav-bar">
          <Link to="/" className="nav-link">Login</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/exam" className="nav-link">Exam</Link>
        </nav>

        {/* Define Routes */}
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exam" element={<ExamPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
