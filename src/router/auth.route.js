const express = require("express");
const { signup, login, logout, refreshToken, getProfile, updateProfile } = require("../controllers/auth.controller");
const { protectRoute } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.put("/update-profile", protectRoute, updateProfile);

module.exports = router;