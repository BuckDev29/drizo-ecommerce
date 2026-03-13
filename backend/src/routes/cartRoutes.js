const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

// Require auth
router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.removeFromCart);

module.exports = router;
