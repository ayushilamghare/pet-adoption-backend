const express = require("express");
const router = express.Router();

const {
  applyForPet,
  getMyApplications,
  getShelterApplications,
  updateApplicationStatus
} = require("../controller/applicationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("adopter"), applyForPet);
router.get("/my", authMiddleware, roleMiddleware("adopter"), getMyApplications);
router.get("/shelter", authMiddleware, roleMiddleware("shelter"), getShelterApplications);
router.put("/:id", authMiddleware, roleMiddleware("shelter"), updateApplicationStatus);

module.exports = router;
