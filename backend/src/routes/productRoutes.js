const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();
const productController = require("../controllers/productController");

// Público
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// Admin
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  productController.deleteProduct,
);

module.exports = router;
