"use client"

import { useNavigate } from "react-router-dom"
import { Lock, User, UserPlus } from "lucide-react"
import "./LoginPrompt.css"

const LoginPrompt = () => {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate("/login")
  }

  const handleRegisterClick = () => {
    navigate("/register")
  }

  return (
    <div className="login-prompt-overlay">
      <div className="login-prompt-container">
        <div className="login-prompt-content">
          <div className="login-prompt-icon">
            <Lock className="lock-icon" />
          </div>

          <div className="login-prompt-header">
            <h2 className="login-prompt-title">Authentication Required</h2>
            <p className="login-prompt-subtitle">Please login first to show the dashboard information</p>
          </div>

          <div className="login-prompt-message">
            <p>
              You need to be authenticated to access your MAATI AI dashboard. Login to view your farm data,
              monitor crops, and manage your agricultural operations.
            </p>
          </div>

          <div className="login-prompt-actions">
            <button className="login-btn-primary" onClick={handleLoginClick}>
              <User className="btn-icon" />
              Login
            </button>

            <div className="login-prompt-divider">
              <span>or</span>
            </div>

            <button className="register-btn-secondary" onClick={handleRegisterClick}>
              <UserPlus className="btn-icon" />
              Register Now
            </button>
          </div>

          <div className="login-prompt-footer">
            <p>New to MAATI AI? Create an account to get started!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt
