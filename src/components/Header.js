import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';  // Path to the CSS file

const Header = () => {
  return (
    <header className="top-bar">
      <nav className="navbar">
        <Link to="/login" className="nav-link active">Login</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/exam" className="nav-link">Exam</Link>
      </nav>
    </header>
  );
};

export default Header;
