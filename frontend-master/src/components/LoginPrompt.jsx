"use client"

import { useNavigate } from "react-router-dom"
import { Lock, User, UserPlus } from "lucide-react"
import "../styles/LoginPrompt.css"

const LoginPrompt = ({
  title = "Authentication Required",
  subtitle = "Please login first to show the dashboard information",
  message = "You need to be authenticated to access your MAATI AI dashboard. Login to view your farm data, monitor crops, and manage your agricultural operations.",
  footerMessage = "New to MAATI AI? Create an account to get started!",
  onAction,
}) => {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    onAction?.()
    navigate("/login")
  }

  const handleRegisterClick = () => {
    onAction?.()
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
            <h2 className="login-prompt-title">{title}</h2>
            <p className="login-prompt-subtitle">{subtitle}</p>
          </div>

          <div className="login-prompt-message">
            <p>{message}</p>
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
            <p>{footerMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt
