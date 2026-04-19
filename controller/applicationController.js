const Application = require("../model/Application");
const Pet = require("../model/Pet");
const sendEmail = require("../utils/sendEmail");
const User = require("../model/User");

// POST /applications
exports.applyForPet = async (req, res) => {
  try {
    // normal users or fosters can apply
    if (req.user.role !== "adopter" && req.user.role !== "foster") {
      return res.status(403).json({ message: "Only adopters and fosters can apply for pets" });
    }

    const { petId, answers, fosterDuration } = req.body;

    if (!petId) {
      return res.status(400).json({ message: "Pet ID is required" });
    }

    // Validate answers note length if provided
    if (answers && answers.note && answers.note.length > 1000) {
      return res.status(400).json({ message: "Application note must be under 1000 characters" });
    }

    // check pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.status !== "available") {
      return res.status(400).json({ message: "This pet is not currently available for adoption" });
    }

    const existing = await Application.findOne({
      user: req.user.id,
      pet: petId
    });

    if (existing) {
      return res.status(400).json({ message: "You have already applied for this pet" });
    }

    if (req.user.role === "foster") {
      if (!fosterDuration || fosterDuration.value === undefined || fosterDuration.value === "") {
        return res.status(400).json({ message: "Foster duration is required" });
      }
      const durValue = Number(fosterDuration.value);
      if (!Number.isInteger(durValue) || durValue <= 0) {
        return res.status(400).json({ message: "Foster duration must be a positive whole number" });
      }
      if (!fosterDuration.unit || !["hours", "days", "months"].includes(fosterDuration.unit)) {
        return res.status(400).json({ message: "Foster duration unit must be hours, days, or months" });
      }
    }

    // create application
    const application = await Application.create({
      user: req.user.id,
      pet: petId,
      type: pet.type, // 'adoption' or 'foster'
      shelter: pet.shelter,
      answers,
      fosterDuration: req.user.role === "foster" ? fosterDuration : undefined
    });
    const shelter = await User.findById(pet.shelter);
    const applicant = await User.findById(req.user.id);

    if (shelter?.email) {
      try {
        const htmlContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #4CAF50; color: white; padding: 25px 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">New Adoption Request</h2>
            </div>
            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; line-height: 1.5;">Hello <strong>${shelter.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5;">Great news! You have received a new <strong>${application.type}</strong> request for <strong>${pet.name}</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-left: 5px solid #4CAF50; margin: 25px 0; border-radius: 0 4px 4px 0;">
                <h3 style="margin-top: 0; color: #2e7d32; font-size: 18px;">Applicant Details:</h3>
                <ul style="list-style-type: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 10px; font-size: 15px;"><strong style="color: #555;">Name:</strong> ${applicant.name}</li>
                  <li style="font-size: 15px;"><strong style="color: #555;">Email:</strong> ${applicant.email}</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Please log in to your shelter dashboard to review the full details and answers provided by the applicant.</p>
              
              <div style="text-align: center;">
                <a href="#" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Review Application</a>
              </div>
            </div>
            <div style="background-color: #f5f5f5; color: #666; padding: 20px; text-align: center; font-size: 13px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 5px 0;"><strong>Adoptly</strong> &mdash; Connect with loving homes</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adoptly Pet Adoption Platform. All rights reserved.</p>
            </div>
          </div>
        `;
        await sendEmail(
          shelter.email,
          `New ${pet.type === 'adoption' ? 'Adoption' : 'Foster'} Request for ${pet.name}`,
          htmlContent
        );
      } catch (emailError) {
        console.error("Failed to send application email to shelter:", emailError.message);
      }
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

      // Automatically reject other active applications for this pet
      await Application.updateMany(
        { pet: application.pet._id, _id: { $ne: application._id }, status: { $nin: ["rejected", "approved"] } },
        { $set: { status: "rejected", shelterNote: "This pet has been adopted by another applicant." } }
      );
    }

    const applicant = await User.findById(application.user);

    if (applicant?.email) {
      try {
        const statusColors = {
          approved: "#4CAF50",
          rejected: "#F44336",
          pending: "#FF9800",
          more_info_requested: "#2196F3",
          meet_scheduled: "#9C27B0"
        };
        const statusColor = statusColors[status] || "#333";
        const formattedStatus = status.replace(/_/g, " ").toUpperCase();
        
        const htmlContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: ${statusColor}; color: white; padding: 25px 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">Application Update</h2>
            </div>
            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; line-height: 1.5;">Hello <strong>${applicant.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5;">The status of your application for <strong>${application.pet.name}</strong> has been updated:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: ${statusColor}1A; color: ${statusColor}; border: 2px solid ${statusColor}; padding: 12px 24px; font-weight: 800; border-radius: 30px; font-size: 18px; letter-spacing: 1px;">
                  ${formattedStatus}
                </span>
              </div>
              
              ${shelterNote ? `
              <div style="background-color: #f9f9f9; padding: 20px; border-left: 5px solid ${statusColor}; margin: 25px 0; border-radius: 0 4px 4px 0;">
                <h3 style="margin-top: 0; font-size: 16px; color: #444;">Message from Shelter:</h3>
                <p style="margin: 0; font-style: italic; color: #555; line-height: 1.5;">"${shelterNote}"</p>
              </div>` : ''}
              
              ${scheduledMeet ? `
              <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #9C27B0;">
                <h3 style="margin-top: 0; color: #7b1fa2; font-size: 16px; display: flex; align-items: center;">📅 Scheduled Meet Details</h3>
                <p style="margin: 0; font-size: 15px; color: #4a148c; font-weight: bold;">${new Date(scheduledMeet).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>` : ''}
              
              <p style="font-size: 15px; line-height: 1.5; margin-top: 25px;">Please check your dashboard for any further actions required on your end.</p>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="#" style="display: inline-block; background-color: ${statusColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: opacity 0.3s;">View My Application</a>
              </div>
            </div>
            <div style="background-color: #f5f5f5; color: #666; padding: 20px; text-align: center; font-size: 13px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 5px 0;"><strong>Adoptly</strong> &mdash; Connect with loving homes</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Adoptly Pet Adoption Platform. All rights reserved.</p>
            </div>
          </div>
        `;

        await sendEmail(
          applicant.email,
          `Adoptly: Update on your application for ${application.pet.name}`,
          htmlContent
        );
      } catch (emailError) {
        console.error("Failed to send status update email to applicant:", emailError.message);
      }
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
