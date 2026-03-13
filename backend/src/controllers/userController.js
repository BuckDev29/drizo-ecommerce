const db = require("../config/db");
const bcrypt = require("bcryptjs");

/* GET USER PROFILE */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query(
      "SELECT id, name, email, role, shopping_preference, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener perfil",
      error: error.message
    });
  }
};

/* UPDATE USER PROFILE */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, password, shopping_preference } = req.body;

    // Verificar si el usuario existe
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let updateQuery = "UPDATE users SET name = ?";
    let queryParams = [name || users[0].name];

    if (shopping_preference !== undefined) {
      updateQuery += ", shopping_preference = ?";
      queryParams.push(shopping_preference);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      queryParams.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(userId);

    await db.query(updateQuery, queryParams);

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar perfil",
      error: error.message
    });
  }
};
