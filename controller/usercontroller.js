const User = require("../model/User");
const Pet = require("../model/Pet");
const Message = require("../model/Message");

// GET profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, phone, address } = req.body;

    // Field-specific validation
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
    }
    if (phone !== undefined && phone.trim()) {
      if (!/^[\d\s\-\+\(\)]{7,15}$/.test(phone.trim())) {
        return res.status(400).json({ message: "Phone must be 7–15 characters (digits, spaces, dashes, and parentheses only)" });
      }
    }
    if (address !== undefined && address.length > 200) {
      return res.status(400).json({ message: "Address must be under 200 characters" });
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();

    const updated = await user.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile. Please try again." });
  }
};

// GET contacts
exports.getContacts = async (req, res) => {
  try {
    const { q } = req.query;
    let query = { _id: { $ne: req.user.id } };

    if (q) {
      // If searching, search all users by name or email
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ];
    } else {
      // By default, only show users with whom there's an existing conversation
      const messages = await Message.find({
        $or: [{ sender: req.user.id }, { receiver: req.user.id }]
      }).select("sender receiver");

      const userIds = new Set();
      messages.forEach(m => {
        userIds.add(m.sender.toString());
        userIds.add(m.receiver.toString());
      });
      userIds.delete(req.user.id.toString());

      query._id = { $in: Array.from(userIds) };
    }

    const contacts = await User.find(query)
      .select("name email role phone address")
      .sort({ role: 1, name: 1 })
      .limit(50);

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET favorites
exports.getFavorites = async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res.status(403).json({ message: "Only adopters can manage favorites" });
    }

    const user = await User.findById(req.user.id)
      .populate({
        path: "favorites",
        populate: {
          path: "shelter",
          select: "name email"
        }
      });

    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT favorites/:petId
exports.addFavorite = async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res.status(403).json({ message: "Only adopters can add favorites" });
    }

    const pet = await Pet.findById(req.params.petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favorites: req.params.petId } },
      { new: true }
    ).populate("favorites");

    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE favorites/:petId
exports.removeFavorite = async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res.status(403).json({ message: "Only adopters can remove favorites" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: req.params.petId } },
      { new: true }
    ).populate("favorites");

    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
