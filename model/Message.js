const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  conversationId: {
    type: String,
    required: true
  },

  relatedPet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet"
  },

  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


// 📊 Indexes
MessageSchema.index({ conversationId: 1 });
MessageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("Message", MessageSchema);
