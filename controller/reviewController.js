const Review = require("../model/Review");
const Pet = require("../model/Pet");
const User = require("../model/User");

// POST /reviews
exports.addReview = async (req, res) => {
  try {
    if (req.user.role !== "adopter" && req.user.role !== "foster") {
      return res.status(403).json({ message: "Only adopters and fosters can review pets" });
    }

    const { petId, rating, comment } = req.body;

    if (!petId) {
      return res.status(400).json({ message: "petId is required" });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    const existingReview = await Review.findOne({
      user: req.user.id,
      pet: petId
    });

    if (existingReview) {
      return res.status(400).json({ message: "You already reviewed this pet" });
    }

    const review = await Review.create({
      user: req.user.id,
      pet: petId,
      shelter: pet.shelter,
      rating: numericRating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /reviews/me
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("pet", "name type images")
      .populate("shelter", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /reviews/shelter
exports.getShelterReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ shelter: req.user.id })
      .populate("user", "name")
      .populate("pet", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /reviews/pet/:petId
exports.getPetReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ pet: req.params.petId })
      .populate("user", "name role")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
