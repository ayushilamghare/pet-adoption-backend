const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true
  },

  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  }

}, { timestamps: true });

// Removed strict duplicate index directly tying to user and shelter

module.exports = mongoose.model("Review", ReviewSchema);
