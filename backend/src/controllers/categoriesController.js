const db = require("../config/db");

exports.createCategory = async (req, res) => {
  try {
    const { name, gender, image_url } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    await db.query(
      "INSERT INTO categories (name, slug, gender, image_url) VALUES (?, ?, ?, ?)",
      [name, slug, gender || "unisex", image_url || null],
    );

    res.status(201).json({ message: "Categoría creada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { gender } = req.query;
    let query = "SELECT * FROM categories";
    let params = [];

    if (gender) {
      query += " WHERE gender = ?";
      params.push(gender);
    }

    query += " ORDER BY created_at DESC";

    const [categories] = await db.query(query, params);
    res.json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT * FROM categories WHERE id = ?",
      [req.params.id],
    );

    if (categories.length === 0)
      return res.status(404).json({ message: "Category not found" });

    res.json(categories[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching category", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, gender, image_url } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const [result] = await db.query(
      "UPDATE categories SET name = ?, slug = ?, gender = ?, image_url = ? WHERE id = ?",
      [name, slug, gender, image_url || null, req.params.id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Categoría actualizada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM categories WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};
