import express from "express";
import {
  createOrder,
  submitUpiProof,
  getOrderById,
  getMyOrders,
  adminListOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

router.get("/admin", protect, admin, adminListOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

router.get("/:id", protect, getOrderById);
router.post("/:id/upi-proof", protect, submitUpiProof);

export default router;
