import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCollection,
} from "../../controllers/productController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public: view all & single
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/by-collection/:id", getProductsByCollection); 


// Admin: CRUD
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

export default router;
