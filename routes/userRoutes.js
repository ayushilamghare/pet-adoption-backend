const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getContacts,
  getFavorites,
  addFavorite,
  removeFavorite
} = require("../controller/usercontroller");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/contacts", authMiddleware, getContacts);
router.get("/favorites", authMiddleware, roleMiddleware("adopter"), getFavorites);
router.put("/favorites/:petId", authMiddleware, roleMiddleware("adopter"), addFavorite);
router.delete("/favorites/:petId", authMiddleware, roleMiddleware("adopter"), removeFavorite);
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

module.exports = router;
