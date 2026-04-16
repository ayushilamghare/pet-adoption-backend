const Foster = require("../model/Foster");
const Pet = require("../model/Pet");

// POST /foster/register
exports.registerFoster = async (req, res) => {
  try {
    if (req.user.role !== "foster") {
      return res.status(403).json({ message: "Only foster role allowed" });
    }

    const { bio, experience } = req.body;
    const existing = await Foster.findOne({ user: req.user.id });

    if (existing) {
      return res.status(400).json({ message: "Already registered as foster" });
    }

    const foster = await Foster.create({
      user: req.user.id,
      bio,
      experience
    });

    res.status(201).json(foster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /foster/me
exports.getMyFosterPets = async (req, res) => {
  try {
    if (req.user.role !== "foster") {
      return res.status(403).json({ message: "Only foster role allowed" });
    }

    const fosterProfile = await Foster.findOne({ user: req.user.id });
    if (!fosterProfile) {
      return res.status(404).json({ message: "Foster profile not found" });
    }

    // Find pets assigned to this foster
    const pets = await Pet.find({ fosterParent: req.user.id });

    res.json({ ...fosterProfile.toObject(), pets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /foster/assign
exports.assignPetToFoster = async (req, res) => {
  try {
    const { petId, fosterId } = req.body;

    if (!petId || !fosterId) {
      return res.status(400).json({ message: "petId and fosterId are required" });
    }

    if (req.user.role !== "shelter") {
      return res.status(403).json({ message: "Only shelters can assign foster" });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fosterProfile = await Foster.findOne({ user: fosterId });
    if (!fosterProfile) {
      return res.status(404).json({ message: "Foster profile not found" });
    }

    // assign pet
    pet.fosterParent = fosterId;
    pet.status = "fostered";
    await pet.save();

    res.json({ message: "Pet assigned to foster" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Placeholder for journal updates (to be refactored into standalone model)
exports.updateFosterStatus = async (req, res) => {
  res.status(501).json({ message: "Foster journal system is being modernized. Please use the unified Pet Status system." });
};
