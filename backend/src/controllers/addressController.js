const db = require("../config/db");

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const [addresses] = await db.query(
      "SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener direcciones", error: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { street, city, state, zip_code, country } = req.body;

    if (!street || !city || !state || !zip_code || !country) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben ser proporcionados" });
    }

    const [result] = await db.query(
      "INSERT INTO addresses (user_id, street, city, state, zip_code, country) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, street, city, state, zip_code, country]
    );

    res.status(201).json({ message: "Dirección agregada", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar dirección", error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { street, city, state, zip_code, country } = req.body;

    const [result] = await db.query(
      "UPDATE addresses SET street = ?, city = ?, state = ?, zip_code = ?, country = ? WHERE id = ? AND user_id = ?",
      [street, city, state, zip_code, country, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Dirección no encontrada o sin permisos" });
    res.json({ message: "Dirección actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar dirección", error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const [result] = await db.query("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Dirección no encontrada" });
    res.json({ message: "Dirección eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar dirección", error: error.message });
  }
};
