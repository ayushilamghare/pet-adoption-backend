const express = require("express");
const router = express.Router();

const {
  registerFoster,
  getMyFosterPets,
  updateFosterStatus,
  assignPetToFoster
} = require("../controller/fosterController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/register", authMiddleware, roleMiddleware("foster"), registerFoster);
router.get("/me", authMiddleware, roleMiddleware("foster"), getMyFosterPets);
router.put("/update", authMiddleware, roleMiddleware("foster"), updateFosterStatus);
router.put("/assign", authMiddleware, roleMiddleware("shelter"), assignPetToFoster);

module.exports = router;
