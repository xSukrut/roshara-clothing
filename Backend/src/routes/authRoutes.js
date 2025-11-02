import express from "express";
import { authUser, registerUser, getProfile } from "./../../controllers/authController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authUser);
router.post("/register", registerUser);
router.get("/profile", protect, getProfile);

export default router;

