import React from 'react';
import '../styles/LoginPage.css'; // Import the new CSS file

const LoginPage = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <form>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="button">Sign In</button>
        </form>
        <p>
          Don't have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;