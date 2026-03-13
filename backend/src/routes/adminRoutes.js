const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// Dashboard
router.get("/stats", adminController.getDashboardStats);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// Order management
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderDetail);
router.put("/orders/:id/status", adminController.updateOrderStatus);

module.exports = router;
