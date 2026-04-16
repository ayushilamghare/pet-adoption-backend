const express = require("express");
const router = express.Router();

const {
  addReview,
  getMyReviews,
  getShelterReviews,
  getPetReviews,
  deleteReview
} = require("../controller/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("adopter", "foster"), addReview);
router.get("/me", authMiddleware, roleMiddleware("adopter", "foster"), getMyReviews);
router.get("/shelter", authMiddleware, roleMiddleware("shelter"), getShelterReviews);
router.get("/pet/:petId", getPetReviews);
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;
