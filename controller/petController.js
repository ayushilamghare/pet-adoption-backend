const Pet = require("../model/Pet");

const isValidURL = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
// POST /pets
exports.createPet = async (req, res) => {
  try {
    // only shelter allowed
    if (req.user.role !== "shelter") {
      return res.status(403).json({ message: "Only shelters can add pet listings" });
    }

    const { name, age, breed, size, type, location } = req.body;

    // Field-specific validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Pet name is required" });
    }
    const nameStr = name.trim();
    if (nameStr.length < 2 || nameStr.length > 50) {
      return res.status(400).json({ message: "Pet name must be between 2 and 50 characters" });
    }
    
    if (!breed || !breed.trim()) {
      return res.status(400).json({ message: "Breed is required" });
    }
    const breedStr = breed.trim();
    if (breedStr.length > 50) {
      return res.status(400).json({ message: "Breed must be at most 50 characters" });
    }
    if (!/^[a-zA-Z\s]+$/.test(breedStr)) {
      return res.status(400).json({ message: "Breed can only contain letters" });
    }

    const colorStr = req.body.color ? req.body.color.trim() : "";
    if (colorStr && !/^[a-zA-Z\s]+$/.test(colorStr)) {
      return res.status(400).json({ message: "Color can only contain letters" });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ message: "Location is required" });
    }
    const locStr = location.trim();
    if (locStr.length < 2 || locStr.length > 100) {
      return res.status(400).json({ message: "Location must be between 2 and 100 characters" });
    }
    if (!/^[a-zA-Z\s\-,]+$/.test(locStr)) {
      return res.status(400).json({ message: "Location must be a valid city name" });
    }

    if (age === undefined || age === null || (typeof age === "object" && (age.value === undefined || age.value === ""))) {
      return res.status(400).json({ message: "Age is required" });
    }
    const ageValue = typeof age === "object" ? Number(age.value) : Number(age);
    const ageUnit = typeof age === "object" ? age.unit : "years";
    if (isNaN(ageValue) || ageValue < 0) {
      return res.status(400).json({ message: "Age must be a non-negative number" });
    }
    if (ageUnit === "years" && ageValue > 30) return res.status(400).json({ message: "Max age is 30 years" });
    if (ageUnit === "months" && ageValue > 360) return res.status(400).json({ message: "Max age is 360 months" });
    if (ageUnit === "days" && ageValue > 10950) return res.status(400).json({ message: "Max age is 10950 days" });

    if (req.body.images && Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        if (!isValidURL(img)) return res.status(400).json({ message: "One or more photo URLs are invalid" });
      }
    }
    if (req.body.videos && Array.isArray(req.body.videos)) {
      for (const vid of req.body.videos) {
        if (!isValidURL(vid)) return res.status(400).json({ message: "One or more video URLs are invalid" });
      }
    }
    if (!size) {
      return res.status(400).json({ message: "Size is required" });
    }
    if (!["small", "medium", "large"].includes(size)) {
      return res.status(400).json({ message: "Size must be 'small', 'medium', or 'large'" });
    }
    if (!type) {
      return res.status(400).json({ message: "Listing type is required" });
    }
    if (!["adoption", "foster"].includes(type)) {
      return res.status(400).json({ message: "Listing type must be 'adoption' or 'foster'" });
    }

    const pet = await Pet.create({
      ...req.body,
      shelter: req.user.id
    });

    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /pets?breed=lab&location=Nagpur
exports.getPets = async (req, res) => {
  try {
    const query = {};

    if (req.query.breed) query.breed = new RegExp(req.query.breed, "i");
    if (req.query.age) query["age.value"] = Number(req.query.age);
    if (req.query.size) query.size = req.query.size;
    if (req.query.type) query.type = req.query.type;
    if (req.query.location) query.location = new RegExp(req.query.location, "i");
    if (req.query.status) query.status = req.query.status;

    const jwt = require("jsonwebtoken");
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const token = header.split(" ")[1];
        if (process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.role === "foster") {
            query.type = "foster";
          } else if (decoded.role === "adopter") {
            query.type = "adoption";
          }
        }
      } catch (err) {
        // ignore invalid tokens for a public route
      }
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const sortBy = ["createdAt", "age.value", "name"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [pets, total] = await Promise.all([
      Pet.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("shelter", "name email"),
      Pet.countDocuments(query)
    ]);

    res.json({
      page,
      limit,
      count: pets.length,
      total,
      totalPages: Math.ceil(total / limit),
      pets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /pets/:id
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate("shelter", "name email")
      .populate("fosterParent", "name email");

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /pets/:id
exports.updatePet = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.shelter;
    delete updates.fosterParent;

    // Field-specific validation for any provided fields
    if (updates.name !== undefined) {
      if (!updates.name || !updates.name.trim()) {
        return res.status(400).json({ message: "Pet name cannot be empty" });
      }
      const nameStr = updates.name.trim();
      if (nameStr.length < 2 || nameStr.length > 50) {
        return res.status(400).json({ message: "Pet name must be between 2 and 50 characters" });
      }
    }
    if (updates.breed !== undefined) {
      const breedStr = updates.breed.trim();
      if (!breedStr) {
        return res.status(400).json({ message: "Breed cannot be empty" });
      }
      if (breedStr.length > 50) {
        return res.status(400).json({ message: "Breed must be at most 50 characters" });
      }
      if (!/^[a-zA-Z\s]+$/.test(breedStr)) {
        return res.status(400).json({ message: "Breed can only contain letters" });
      }
    }
    if (updates.color !== undefined) {
      const colorStr = updates.color.trim();
      if (colorStr && !/^[a-zA-Z\s]+$/.test(colorStr)) {
        return res.status(400).json({ message: "Color can only contain letters" });
      }
    }
    if (updates.location !== undefined) {
      const locStr = updates.location.trim();
      if (!locStr) {
        return res.status(400).json({ message: "Location cannot be empty" });
      }
      if (locStr.length < 2 || locStr.length > 100) {
        return res.status(400).json({ message: "Location must be between 2 and 100 characters" });
      }
      if (!/^[a-zA-Z\s\-,]+$/.test(locStr)) {
        return res.status(400).json({ message: "Location must be a valid city name" });
      }
    }
    if (updates.age !== undefined) {
      const ageValue = typeof updates.age === "object" ? Number(updates.age.value) : Number(updates.age);
      const ageUnit = typeof updates.age === "object" ? updates.age.unit : "years";
      if (isNaN(ageValue) || ageValue < 0) {
        return res.status(400).json({ message: "Age must be a non-negative number" });
      }
      if (ageUnit === "years" && ageValue > 30) return res.status(400).json({ message: "Max age is 30 years" });
      if (ageUnit === "months" && ageValue > 360) return res.status(400).json({ message: "Max age is 360 months" });
      if (ageUnit === "days" && ageValue > 10950) return res.status(400).json({ message: "Max age is 10950 days" });
    }
    if (updates.images && Array.isArray(updates.images)) {
      for (const img of updates.images) {
        if (!isValidURL(img)) return res.status(400).json({ message: "One or more photo URLs are invalid" });
      }
    }
    if (updates.videos && Array.isArray(updates.videos)) {
      for (const vid of updates.videos) {
        if (!isValidURL(vid)) return res.status(400).json({ message: "One or more video URLs are invalid" });
      }
    }
    if (updates.size && !["small", "medium", "large"].includes(updates.size)) {
      return res.status(400).json({ message: "Size must be 'small', 'medium', or 'large'" });
    }
    if (updates.type && !["adoption", "foster"].includes(updates.type)) {
      return res.status(400).json({ message: "Listing type must be 'adoption' or 'foster'" });
    }
    if (updates.status && !["available", "adopted", "fostered"].includes(updates.status)) {
      return res.status(400).json({ message: "Status must be 'available', 'adopted', or 'fostered'" });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to edit this listing" });
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /pets/:id
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this listing" });
    }

    await pet.deleteOne();

    res.json({ message: "Pet listing removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
