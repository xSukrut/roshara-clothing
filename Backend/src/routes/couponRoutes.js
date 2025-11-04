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

router.get("/active", getActiveCoupons);

router.post("/redeem", protect, redeemCoupon);

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
