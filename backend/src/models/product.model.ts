import db from "../config/db";

export const createProduct = async (product: any) => {
  const { name, price, stock, image_url, category } = product;

  const [result]: any = await db.query(
    `INSERT INTO products 
    (name, price, stock, image_url, category)
    VALUES (?, ?, ?, ?, ?)`,
    [name, price, stock, image_url, category],
  );

  return result.insertId;
};

export const getAllProducts = async () => {
  const [rows] = await db.query(
    "SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC",
  );
  return rows;
};

export const getProductById = async (id: number) => {
  const [rows]: any = await db.query("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  return rows[0];
};
