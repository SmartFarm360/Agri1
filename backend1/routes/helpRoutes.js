const express = require("express");
const router = express.Router();
const HelpFeedback = require("../models/HelpFeedback");
const { ensureMongoConnection } = require("../config/mongo");
// const authMiddleware = require("../middleware/authMiddleware"); // optional

router.use(ensureMongoConnection);

// POST /api/help/feedback
router.post("/feedback", async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || !feedback) {
      return res.status(400).json({ message: "Rating and feedback are required" });
    }

    const newFeedback = new HelpFeedback({
      rating,
      feedback,
      // user: req.user.name // if using authMiddleware
    });

    await newFeedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
});

module.exports = router;
