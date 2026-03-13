const db = require("../config/db");

exports.createOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;
    const { address_id, payment_method, notes } = req.body;

    if (!address_id || !payment_method) {
      await conn.rollback();
      conn.release();
      return res
        .status(400)
        .json({ message: "address_id y payment_method son requeridos" });
    }

    const [addresses] = await conn.query(
      "SELECT id FROM addresses WHERE id = ? AND user_id = ?",
      [address_id, userId],
    );
    if (addresses.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Dirección no válida" });
    }

    // Leemos el carrito con los precios actuales, por si alguno cambió
    const [cartItems] = await conn.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId],
    );

    if (cartItems.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Verificamos que haya stock suficiente para cada producto
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          message: `Stock insuficiente para "${item.name}". Disponible: ${item.stock}`,
        });
      }
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, address_id, payment_method, total_price, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        address_id,
        payment_method,
        totalPrice.toFixed(2),
        notes || null,
      ],
    );
    const orderId = orderResult.insertId;

    // Guardamos cada item y descontamos el inventario
    for (const item of cartItems) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, item.price],
      );
      await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
        item.quantity,
        item.product_id,
      ]);
    }

    // Vaciamos el carrito al confirmar la compra
    await conn.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: "Orden creada correctamente",
      order_id: orderId,
      total_price: totalPrice.toFixed(2),
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res
      .status(500)
      .json({ message: "Error al crear la orden", error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await db.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status,
              o.total_price, o.created_at,
              a.street, a.city, a.country
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId],
    );

    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las órdenes", error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status,
              o.total_price, o.notes, o.created_at, o.updated_at,
              a.street, a.city, a.state, a.zip_code, a.country
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId],
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const [items] = await db.query(
      `SELECT oi.quantity, oi.unit_price,
              p.id as product_id, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id],
    );

    res.json({ ...orders[0], items });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener la orden", error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await conn.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (orders.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (orders[0].status !== "pending") {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        message: "Solo se pueden cancelar órdenes en estado 'pending'",
      });
    }

    // Devolvemos el stock de los productos cancelados
    const [items] = await conn.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id],
    );
    for (const item of items) {
      await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [
        item.quantity,
        item.product_id,
      ]);
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [
      id,
    ]);

    await conn.commit();
    conn.release();

    res.json({ message: "Orden cancelada correctamente" });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res
      .status(500)
      .json({ message: "Error al cancelar la orden", error: error.message });
  }
};
