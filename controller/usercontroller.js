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
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.address = req.body.address || user.address;

  const updated = await user.save();

  res.json(updated);
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
