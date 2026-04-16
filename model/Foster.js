const mongoose = require("mongoose");

const FosterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  bio: String,
  experience: String

}, { timestamps: true });

module.exports = mongoose.model("Foster", FosterSchema);
