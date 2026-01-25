const mongoose = require("mongoose");

const helpFeedbackSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  feedback: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  user: { type: String }, // optional: if logged-in user
});

module.exports = mongoose.model("HelpFeedback", helpFeedbackSchema);
