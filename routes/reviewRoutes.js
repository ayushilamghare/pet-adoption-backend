const express = require("express");
const router = express.Router();

const {
  addReview,
  getReviews
} = require("../controller/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("adopter"), addReview);
router.get("/:shelterId", getReviews);

module.exports = router;
