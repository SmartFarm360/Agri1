"use client"

import { useState } from "react"
import "../styles/Help.css"

const Help = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const faqs = [
    {
      id: 1,
      question: "How do I check the grid/power status of my farm?",
      answer:
        "Navigate to the Dashboard and look for the 'Power Status' widget. It displays real-time grid connectivity, backup power levels, and energy consumption. Green indicates normal operation, yellow shows backup mode, and red indicates power issues.",
    },
    {
      id: 2,
      question: "How can I monitor soil conditions and moisture levels?",
      answer:
        "Go to Dashboard > Soil Monitoring section. Here you'll find real-time data on soil moisture, pH levels, temperature, and nutrient content. You can set custom alerts for optimal ranges and view historical trends to make informed irrigation decisions.",
    },
    {
      id: 3,
      question: "How do I set up automated irrigation schedules?",
      answer:
        "Visit Dashboard > Irrigation Control. Click 'Create Schedule' to set up automated watering based on soil moisture, weather forecasts, and crop requirements. You can create multiple schedules for different zones and crops.",
    },
    {
      id: 4,
      question: "Where can I view weather forecasts and alerts?",
      answer:
        "The Weather section in your Dashboard provides 7-day forecasts, rainfall predictions, temperature trends, and severe weather alerts. This helps you plan farming activities and protect crops from adverse conditions.",
    },
    {
      id: 5,
      question: "How do I access crop recommendations and growth insights?",
      answer:
        "Navigate to Dashboard > Crop Analytics. Our AI analyzes your soil data, weather patterns, and crop history to provide personalized recommendations for planting, fertilizing, and harvesting times.",
    },
    {
      id: 6,
      question: "What should I do if my sensors are not working properly?",
      answer:
        "First, check the sensor status in Dashboard > Device Management. Ensure proper power connection and clean sensor surfaces. If issues persist, try restarting the device or contact our technical support team for assistance.",
    },
    {
      id: 7,
      question: "How can I export my farm data and generate reports?",
      answer:
        "Go to Dashboard > Reports section. Select the data type (soil, weather, irrigation, etc.), choose date range, and click 'Export'. You can download data in CSV, PDF, or Excel formats for analysis or record-keeping.",
    },
    {
      id: 8,
      question: "How do I manage user accounts and permissions?",
      answer:
        "Access Account Settings from the profile menu. Farm owners can add team members, set role-based permissions (view-only, operator, admin), and manage access to different farm sections and controls.",
    },
    {
      id: 9,
      question: "How do I set up alerts and notifications?",
      answer:
        "Visit Dashboard > Notification Settings. Configure alerts for critical events like low soil moisture, equipment failures, weather warnings, or harvest reminders. Choose delivery methods: email, SMS, or in-app notifications.",
    },
    {
      id: 10,
      question: "How can I contact technical support?",
      answer:
        "You can reach our support team through multiple channels: Email us at support@maatiai.com, call our helpline at +91 xxxxxxxx (9 AM - 6 PM), or use the 'Send Feedback' option in your profile menu for non-urgent queries.",
    },
  ]

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const handleStarClick = (starValue) => {
    setRating(starValue)
  }

  const handleStarHover = (starValue) => {
    setHoverRating(starValue)
  }

  const handleStarLeave = () => {
    setHoverRating(0)
  }

  const handleFeedbackSubmit = async (e) => {
  e.preventDefault();
  if (rating > 0 && feedback.trim()) {
    try {
      const response = await fetch("/api/help/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setRating(0);
        setFeedback("");
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  }
};


  return (
    <div className="help-container">
      <div className="help-header">
        <h1>Help & Support</h1>
        <p>Find answers to frequently asked questions about MAATI AI</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input type="text" placeholder="Search for help topics..." className="search-input" />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <div className="faq-question" onClick={() => toggleFAQ(faq.id)}>
                <span className="question-text">{faq.question}</span>
                <span className={`faq-icon ${expandedFAQ === faq.id ? "expanded" : ""}`}>
                  {expandedFAQ === faq.id ? "−" : "+"}
                </span>
              </div>
              {expandedFAQ === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="contact-support">
        <div className="support-card">
          <h3>Still need help?</h3>
          <p>Can't find what you're looking for? Our support team is here to help!</p>
          <div className="support-options">
            <div className="support-option">
              <span className="support-icon">📧</span>
              <div>
                <strong>Email Support</strong>
                <p>support@maatiai.com</p>
              </div>
            </div>
            <div className="support-option">
              <span className="support-icon">📞</span>
              <div>
                <strong>Phone Support</strong>
                <p>+91 xxxxxxxx (9 AM - 6 PM)</p>
              </div>
            </div>
            <div className="support-option">
              <span className="support-icon">💬</span>
              <div>
                <strong>Live Chat</strong>
                <p>Available 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="feedback-section">
        <div className="feedback-card">
          <h3>Share Your Feedback</h3>
          <p>Help us improve MAATI AI by sharing your experience</p>

          {!isSubmitted ? (
            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              <div className="rating-section">
                <label className="rating-label">Rate your experience:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= (hoverRating || rating) ? "active" : ""}`}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={handleStarLeave}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">
                  {rating > 0 && (
                    <span>
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  )}
                </span>
              </div>

              <div className="feedback-input-section">
                <label htmlFor="feedback-text" className="feedback-label">
                  Tell us more about your experience:
                </label>
                <textarea
                  id="feedback-text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report any issues you've encountered..."
                  className="feedback-textarea"
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="feedback-submit-btn" disabled={rating === 0 || !feedback.trim()}>
                Submit Feedback
              </button>
            </form>
          ) : (
            <div className="feedback-success">
              <div className="success-icon">✓</div>
              <h4>Thank you for your feedback!</h4>
              <p>Your review has been submitted successfully. We appreciate your input!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Help
