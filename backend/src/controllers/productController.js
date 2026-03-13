const db = require("../config/db");

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, image_url, category_id } = req.body;

    await db.query(
      `INSERT INTO products 
      (name, price, stock, image_url, category_id) 
      VALUES (?, ?, ?, ?, ?)`,
      [name, price, stock, image_url, category_id],
    );

    res.status(201).json({ message: "Producto creado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creando producto", error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, gender, minPrice, maxPrice } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.gender as category_gender
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    let conditions = [];
    let params = [];

    if (category) {
      if (!isNaN(category)) {
        conditions.push("p.category_id = ?");
        params.push(category);
      } else {
        // Find category_id by slug
        const [catData] = await db.query(
          "SELECT id FROM categories WHERE slug = ?",
          [category],
        );
        if (catData.length > 0) {
          conditions.push("p.category_id = ?");
          params.push(catData[0].id);
        } else {
          return res.json([]);
        }
      }
    }

    if (gender) {
      conditions.push("c.gender = ?");
      params.push(gender);
    }

    if (minPrice) {
      conditions.push("p.price >= ?");
      params.push(minPrice);
    }

    if (maxPrice) {
      conditions.push("p.price <= ?");
      params.push(maxPrice);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY p.created_at DESC";

    const [products] = await db.query(query, params);
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo productos", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(products[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo producto", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, image_url, category_id } = req.body;

    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (products.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const current = products[0];

    const [result] = await db.query(
      `UPDATE products SET name = ?, price = ?, stock = ?, image_url = ?, category_id = ? WHERE id = ?`,
      [
        name ?? current.name,
        price ?? current.price,
        stock ?? current.stock,
        image_url ?? current.image_url,
        category_id ?? current.category_id,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando producto", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error eliminando producto", error: error.message });
  }
};
