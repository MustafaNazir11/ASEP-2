import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', { username, password, userType });

    if (userType === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${userType === 'admin' ? 'admin' : 'student'}`}>
        {/* Login Type Selector at the top */}
        <div className="login-type-toggle">
          <button
            className={userType === 'student' ? 'active' : ''}
            onClick={() => setUserType('student')}
          >
            Student
          </button>
          <button
            className={userType === 'admin' ? 'active' : ''}
            onClick={() => setUserType('admin')}
          >
            Admin
          </button>
        </div>

        <h2>{userType === 'admin' ? 'Admin Login' : 'Student Login'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>

        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
