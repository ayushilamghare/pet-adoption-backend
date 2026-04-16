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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!["adopter", "shelter", "foster"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password, // Model handles hashing in pre-save hook
      role
    });

    res.status(201).json({
      message: "User registered",
      user: userResponse(user)
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }

    res.status(500).json({ message: error.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password using model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = generateToken(user);

    res.json({
      token,
      user: userResponse(user)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
