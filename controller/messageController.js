const mongoose = require("mongoose");
const User = require("../model/User");
const Message = require("../model/Message");

// Helper to get conversationId
const getConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join("_");
};

// POST /messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message, relatedPetId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Recipient is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid recipient" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (message.trim().length < 1) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: "Message is too long (max 2000 characters)" });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      message: message.trim(),
      conversationId: getConversationId(req.user.id, receiverId),
      relatedPet: relatedPetId || null
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /messages/:userId
exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const conversationId = getConversationId(req.user.id, otherUserId);

    const messages = await Message.find({ conversationId })
      .populate("relatedPet", "name images")
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { conversationId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    const latestByConversation = new Map();

    messages.forEach((m) => {
      if (m.conversationId && !latestByConversation.has(m.conversationId)) {
        latestByConversation.set(m.conversationId, m);
      }
    });

    const conversationList = Array.from(latestByConversation.values());

    // Get other users
    const otherUserIds = conversationList.map(m => {
      const senderId = m.sender?._id || m.sender;
      const receiverId = m.receiver?._id || m.receiver;
      if (!senderId || !receiverId) return null;

      const targetId = senderId.toString() === req.user.id ? receiverId : senderId;
      return mongoose.Types.ObjectId.isValid(targetId) ? targetId : null;
    }).filter(id => id);

    const users = await User.find({ _id: { $in: otherUserIds } })
      .select("name email role");

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const result = conversationList.map(m => {
      const otherUserId = m.sender.toString() === req.user.id ? m.receiver.toString() : m.sender.toString();
      return {
        user: userMap.get(otherUserId),
        latestMessage: m,
        conversationId: m.conversationId
      };
    }).filter(c => c.user); // Remove if user deleted

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
