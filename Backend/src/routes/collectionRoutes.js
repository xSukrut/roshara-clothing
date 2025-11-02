import express from "express";
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionProductsAdmin,
  updateCollectionProductsAdmin,
} from "../../controllers/collectionController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public: Get all
router.get("/", getCollections);

// admin products-in-collection management
router.get("/:id/products", protect, admin, getCollectionProductsAdmin);
router.put("/:id/products", protect, admin, updateCollectionProductsAdmin);

// Admin CRUD
router.post("/", protect, admin, createCollection);
router
  .route("/:id")
  .get(getCollectionById)
  .put(protect, admin, updateCollection)
  .delete(protect, admin, deleteCollection);

export default router;

