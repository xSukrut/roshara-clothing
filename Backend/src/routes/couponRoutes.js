// routes/couponRoutes.js
import express from "express";
import {
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  redeemCoupon,
} from "../../controllers/couponController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public: used by checkout page (excludes special coupons)
router.get("/active", getActiveCoupons);

// Public: redeem/validate a coupon (increments usedCount)
router.post("/redeem", redeemCoupon);

// Admin
router
  .route("/")
  .get(protect, admin, getAllCoupons)
  .post(protect, admin, createCoupon);

router
  .route("/:id")
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;
