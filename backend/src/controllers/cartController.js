const db = require("../config/db");

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const [items] = await db.query(
      `SELECT c.id, c.product_id, c.quantity, c.created_at, p.name, p.price, p.image_url 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId],
    );
    res.json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener carrito", error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id)
      return res.status(400).json({ message: "product_id es requerido" });

    const [existing] = await db.query(
      "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
      [userId, product_id],
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
        [quantity, existing[0].id],
      );
      return res.json({ message: "Cantidad actualizada en el carrito" });
    } else {
      const [result] = await db.query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [userId, product_id, quantity],
      );
      return res
        .status(201)
        .json({ message: "Producto agregado al carrito", id: result.insertId });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al agregar al carrito", error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return this.removeFromCart(req, res);
    }

    const [result] = await db.query(
      "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
      [quantity, cartItemId, userId],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Item no encontrado en carrito" });
    res.json({ message: "Cantidad actualizada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar carrito", error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
      [cartItemId, userId],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Item no encontrado" });
    res.json({ message: "Item eliminado del carrito" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar ítem", error: error.message });
  }
};
