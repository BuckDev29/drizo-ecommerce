const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.post("/", orderController.createOrder); // Checkout
router.get("/", orderController.getMyOrders); // My orders list
router.get("/:id", orderController.getOrderById); // Order detail
router.put("/:id/cancel", orderController.cancelOrder); // Cancel order

module.exports = router;
