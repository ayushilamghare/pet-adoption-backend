const Pet = require("../model/Pet");

// POST /pets
exports.createPet = async (req, res) => {
  const { name, age, breed, size, type } = req.body;

  if (!name || age === undefined || !breed || !size || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!["small", "medium", "large"].includes(size)) {
    return res.status(400).json({ message: "Size must be small, medium, or large" });
  }

  if (!["adoption", "foster"].includes(type)) {
    return res.status(400).json({ message: "Type must be adoption or foster" });
  }
  try {
    // only shelter allowed
    if (req.user.role !== "shelter") {
      return res.status(403).json({ message: "Only shelters can add pets" });
    }

    const pet = await Pet.create({
      ...req.body,
      shelter: req.user.id // link pet to logged-in shelter
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

    if (updates.size && !["small", "medium", "large"].includes(updates.size)) {
      return res.status(400).json({ message: "Size must be small, medium, or large" });
    }

    if (updates.type && !["adoption", "foster"].includes(updates.type)) {
      return res.status(400).json({ message: "Type must be adoption or foster" });
    }

    if (updates.status && !["available", "adopted", "fostered"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid pet status" });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    // only the shelter who created it can update
    if (pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
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

    // only shelter can delete its own pet
    if (pet.shelter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await pet.deleteOne();

    res.json({ message: "Pet removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
