const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
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

  type: {
    type: String,
    enum: ["adoption", "foster"],
    required: true
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "rejected",
      "more_info_requested",
      "meet_scheduled"
    ],
    default: "pending"
  },

  answers: {
    type: Map,
    of: String
  },

  scheduledMeet: Date,
  shelterNote: String,

  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });


// Prevent duplicate applications
ApplicationSchema.index({ user: 1, pet: 1 }, { unique: true });


// Validate meeting logic
ApplicationSchema.pre("save", async function () {
  if (this.status === "meet_scheduled" && !this.scheduledMeet) {
    throw new Error("Meeting date required");
  }
});

module.exports = mongoose.model("Application", ApplicationSchema);
