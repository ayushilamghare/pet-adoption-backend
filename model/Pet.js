const mongoose = require("mongoose");

const PetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  age: {
    value: Number,
    unit: {
      type: String,
      enum: ["days", "months", "years"],
      default: "years"
    }
  },

  breed: { type: String, required: true, trim: true },

  size: {
    type: String,
    enum: ["small", "medium", "large"],
    required: true
  },

  color: String,
  medicalHistory: String,

  images: [String],
  videos: [String],

  type: {
    type: String,
    enum: ["adoption", "foster"],
    required: true
  },

  status: {
    type: String,
    enum: ["available", "adopted", "fostered"],
    default: "available"
  },

  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fosterParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  location: { type: String, trim: true }

}, { timestamps: true });


// 🔒 Consistency check
PetSchema.pre("save", async function () {
  if (this.status === "fostered" && !this.fosterParent) {
    throw new Error("Fostered pet must have a foster parent");
  }

  if (this.status !== "fostered" && this.fosterParent) {
    this.fosterParent = null;
  }
});


// 📊 Indexes
PetSchema.index({ type: 1, status: 1 });
PetSchema.index({ shelter: 1 });

module.exports = mongoose.model("Pet", PetSchema);
