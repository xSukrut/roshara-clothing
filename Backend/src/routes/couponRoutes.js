// routes/couponRoutes.js
import express from "express";
import {
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: used by checkout page
router.get("/active", getActiveCoupons);

// Admin
router.route("/")
  .get(protect, admin, getAllCoupons)
  .post(protect, admin, createCoupon);

router.route("/:id")
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;
