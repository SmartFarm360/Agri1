const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const farmController = require("../controllers/farmController");

// CREATE NEW FARM
router.post("/create", authMiddleware, farmController.createFarm);

// GET ALL FARMS OF LOGGED FARMER
router.get("/my", authMiddleware, farmController.getMyFarms);

// GET SINGLE FARM
router.get("/:farmId", authMiddleware, farmController.getFarmById);

module.exports = router;
