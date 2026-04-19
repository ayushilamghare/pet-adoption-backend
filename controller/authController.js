const User = require("../model/User");
const generateToken = require("../utils/generateToken");

const userResponse = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = "adopter" } = req.body;

    // Field-specific validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!["adopter", "shelter", "foster"].includes(role)) {
      return res.status(400).json({ message: "Role must be adopter, shelter, or foster" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role
    });

    res.status(201).json({
      message: "User registered",
      user: userResponse(user)
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password. Please try again." });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: userResponse(user)
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};
