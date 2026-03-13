const db = require("../config/db");

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const [items] = await db.query(
      `SELECT w.id as wishlist_id, w.product_id, w.created_at, p.name, p.price, p.image_url 
       FROM wishlist_items w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId],
    );
    res.json(items);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al obtener la lista de deseos",
        error: error.message,
      });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const [items] = await db.query(
      "SELECT product_id FROM wishlist_items WHERE user_id = ?",
      [userId],
    );
    const productIds = items.map((item) => item.product_id);
    res.json(productIds);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al verificar wishlist", error: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id)
      return res.status(400).json({ message: "product_id es requerido" });

    // Check if already in wishlist
    const [existing] = await db.query(
      "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
      [userId, product_id],
    );

    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: "El producto ya está en tu lista de deseos" });

    const [result] = await db.query(
      "INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)",
      [userId, product_id],
    );

    res
      .status(201)
      .json({ message: "Producto guardado en wishlist", id: result.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al guardar en wishlist", error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    // can be product_id or wishlist_id, but usually working with product_id is easier from frontend heart toggle
    const productId = req.params.product_id;

    const [result] = await db.query(
      "DELETE FROM wishlist_items WHERE product_id = ? AND user_id = ?",
      [productId, userId],
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Producto no encontrado en la wishlist" });
    res.json({ message: "Producto eliminado de la wishlist" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al eliminar de la wishlist",
        error: error.message,
      });
  }
};
