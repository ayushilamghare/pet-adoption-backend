const Review = require("../model/Review");
const User = require("../model/User");
const Pet = require("../model/Pet");

// POST /reviews
exports.addReview = async (req, res) => {
  try {
    // only normal users can review
    if (req.user.role !== "adopter") {
      return res.status(403).json({ message: "Only users can review" });
    }

    const { shelterId, petId, rating, comment } = req.body;

    if (!shelterId && !petId) {
      return res.status(400).json({ message: "shelterId or petId is required" });
    }

    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (shelterId) {
      const shelter = await User.findOne({ _id: shelterId, role: "shelter" });
      if (!shelter) {
        return res.status(404).json({ message: "Shelter not found" });
      }
    }

    if (petId) {
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
    }

    const existingReview = await Review.findOne({
      user: req.user.id,
      shelter: shelterId || null,
      pet: petId || null
    });

    if (existingReview) {
      return res.status(400).json({ message: "You already reviewed this item" });
    }

    const review = await Review.create({
      user: req.user.id,
      shelter: shelterId,
      pet: petId,
      rating: numericRating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /reviews/:shelterId
exports.getReviews = async (req, res) => {
  try {
    const filter = req.query.pet === "true"
      ? { pet: req.params.shelterId }
      : { shelter: req.params.shelterId };

    const reviews = await Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
