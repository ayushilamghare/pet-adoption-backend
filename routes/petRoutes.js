const express = require("express");
const router = express.Router();

const {
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet
} = require("../controller/petController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("shelter"), createPet);
router.get("/", getPets);
router.get("/:id", getPetById);
router.put("/:id", authMiddleware, roleMiddleware("shelter"), updatePet);
router.delete("/:id", authMiddleware, roleMiddleware("shelter"), deletePet);

module.exports = router;
