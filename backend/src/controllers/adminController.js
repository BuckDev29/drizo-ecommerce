const db = require("../config/db");
const bcrypt = require("bcryptjs");

/* DASHBOARD STATS */
exports.getDashboardStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query(
      "SELECT COUNT(*) as totalUsers FROM users",
    );
    const [[{ totalProducts }]] = await db.query(
      "SELECT COUNT(*) as totalProducts FROM products",
    );
    const [[{ totalCategories }]] = await db.query(
      "SELECT COUNT(*) as totalCategories FROM categories",
    );
    const [lowStockProducts] = await db.query(
      "SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC",
    );
    const [[{ totalOrders }]] = await db.query(
      "SELECT COUNT(*) as totalOrders FROM orders",
    );
    const [[{ pendingOrders }]] = await db.query(
      "SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'pending'",
    );
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) as totalRevenue FROM orders WHERE payment_status = 'paid'",
    );

    res.json({
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      totalRevenue,
      lowStockProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas", error: error.message });
  }
};

/* GET ALL USERS */
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, shopping_preference, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener usuarios", error: error.message });
  }
};

/* GET USER BY ID */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(
      "SELECT id, name, email, role, shopping_preference, created_at FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener usuario", error: error.message });
  }
};

/* UPDATE USER (name, email, role, password) */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const current = users[0];

    // Check email uniqueness if changed
    if (email && email !== current.email) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
    }

    let query = "UPDATE users SET name = ?, email = ?, role = ?";
    let params = [
      name || current.name,
      email || current.email,
      role || current.role,
    ];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ", password = ?";
      params.push(hashedPassword);
    }

    query += " WHERE id = ?";
    params.push(id);

    await db.query(query, params);
    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar usuario", error: error.message });
  }
};

/* DELETE USER */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res
        .status(400)
        .json({ message: "No puedes eliminar tu propia cuenta" });
    }

    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar usuario", error: error.message });
  }
};

/* ─────────────────────────────────────────
   ADMIN ORDER MANAGEMENT
───────────────────────────────────────── */

/* GET ALL ORDERS */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, payment_status } = req.query;

    let query = `
      SELECT o.id, o.status, o.payment_method, o.payment_status,
             o.total_price, o.created_at,
             u.id as user_id, u.name as user_name, u.email as user_email,
             a.city, a.country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN addresses a ON o.address_id = a.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push("o.status = ?");
      params.push(status);
    }
    if (payment_status) {
      conditions.push("o.payment_status = ?");
      params.push(payment_status);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY o.created_at DESC";

    const [orders] = await db.query(query, params);
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener órdenes", error: error.message });
  }
};

/* GET ORDER DETAIL (admin) */
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email,
              a.street, a.city, a.state, a.zip_code, a.country
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN addresses a ON o.address_id = a.id
       WHERE o.id = ?`,
      [id],
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

/* UPDATE ORDER STATUS */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado no válido" });
    }
    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ message: "Estado de pago no válido" });
    }

    const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    let query = "UPDATE orders SET";
    const params = [];
    const fields = [];

    if (status) {
      fields.push(" status = ?");
      params.push(status);
    }
    if (payment_status) {
      fields.push(" payment_status = ?");
      params.push(payment_status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Nada que actualizar" });
    }

    query += fields.join(",") + " WHERE id = ?";
    params.push(id);

    await db.query(query, params);
    res.json({ message: "Orden actualizada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar la orden", error: error.message });
  }
};
