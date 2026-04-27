const mongoose = require("mongoose");

let lastMongoError = null;

const isMongoConnected = () => mongoose.connection.readyState === 1;

mongoose.connection.on("connected", () => {
  lastMongoError = null;
  console.log("MongoDB Connected");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  lastMongoError = error;
});

const logMongoHint = () => {
  if (String(process.env.MONGO_URI || "").startsWith("mongodb+srv://")) {
    console.error(
      "MongoDB hint: this URI uses SRV DNS lookup. If your network blocks SRV records, use the standard mongodb:// Atlas URI instead.",
    );
  }
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    lastMongoError = new Error("MONGO_URI is not set");
    console.warn("MongoDB skipped: MONGO_URI is not set");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    return true;
  } catch (error) {
    lastMongoError = error;
    console.error("MongoDB connection error:", error.message);
    logMongoHint();
    return false;
  }
};

const ensureMongoConnection = (req, res, next) => {
  if (isMongoConnected()) {
    return next();
  }

  return res.status(503).json({
    message: "MongoDB-backed features are temporarily unavailable.",
    error: lastMongoError?.message || "MongoDB is not connected.",
  });
};

module.exports = {
  connectDB,
  ensureMongoConnection,
  isMongoConnected,
};
