const Application = require("../model/Application");
const Pet = require("../model/Pet");
const sendEmail = require("../utils/sendEmail");
const User = require("../model/User");

// POST /applications
exports.applyForPet = async (req, res) => {
  try {
    // only normal users can apply
    if (req.user.role !== "adopter") {
      return res.status(403).json({ message: "Only users can apply" });
    }

    const { petId, answers } = req.body;

    if (!petId) {
      return res.status(400).json({ message: "petId is required" });
    }

    // check pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.status !== "available") {
      return res.status(400).json({ message: "This pet is not available for adoption" });
    }

    const existing = await Application.findOne({
      user: req.user.id,
      pet: petId
    });

    if (existing) {
      return res.status(400).json({ message: "Already applied for this pet" });
    }

    // create application
    const application = await Application.create({
      user: req.user.id,
      pet: petId,
      type: pet.type, // 'adoption' or 'foster'
      shelter: pet.shelter,
      answers
    });
    const shelter = await User.findById(pet.shelter);

    if (shelter?.email) {
      await sendEmail(
        shelter.email,
        "New Application",
        "You have a new adoption request"
      );
    }

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /applications/my
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate("pet", "name breed status");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /applications/shelter
exports.getShelterApplications = async (req, res) => {
  try {
    // only shelters
    if (req.user.role !== "shelter") {
      return res.status(403).json({ message: "Only shelters allowed" });
    }

    // find pets of this shelter
    const pets = await Pet.find({ shelter: req.user.id });

    const petIds = pets.map(p => p._id);

    // find applications for those pets
    const applications = await Application.find({ pet: { $in: petIds } })
      .populate("user", "name email")
      .populate("pet", "name");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /applications/:id
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, scheduledMeet, shelterNote } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "more_info_requested", "meet_scheduled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await Application.findById(req.params.id)
      .populate("pet");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // only the shelter of that pet can update
    if (application.pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }


    application.status = status;
    if (scheduledMeet) application.scheduledMeet = scheduledMeet;
    if (shelterNote !== undefined) application.shelterNote = shelterNote;
    await application.save();

    if (status === "approved") {
      application.pet.status = application.type === "foster" ? "fostered" : "adopted";
      if (application.type === "foster") {
        application.pet.fosterParent = application.user;
      }
      await application.pet.save();
    }

    const applicant = await User.findById(application.user);

    if (applicant?.email) {
      await sendEmail(
        applicant.email,
        "Application Update",
        `Your application has been ${status}`
      );
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
