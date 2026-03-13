const express = require("express");
const router = express.Router();
const categoryCtrl = require("../controllers/categoriesController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Público
router.get("/", categoryCtrl.getCategories);
router.get("/:id", categoryCtrl.getCategory);

// Admin
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  categoryCtrl.createCategory,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  categoryCtrl.updateCategory,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  categoryCtrl.deleteCategory,
);

module.exports = router;
