const pool = require('../config/db');

const getAllRoutes = async () => {
  const result = await pool.query('SELECT * FROM routes');
  return result.rows;
};

const getRouteById = async (id) => {
  const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
  return result.rows[0];
};

const createRoute = async (userId, { title, description, duration_hours, difficulty, region }) => {
  const result = await pool.query('INSERT INTO routes (user_id, title, description, duration_hours, difficulty, region) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [userId, title, description, duration_hours, difficulty, region]);
  return result.rows[0];
};

const updateRoute = async (id, { title, description, duration_hours, difficulty, region }) => {
  const result = await pool.query('UPDATE routes SET title = $1, description = $2, duration_hours = $3, difficulty = $4, region = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *', [title, description, duration_hours, difficulty, region, id]);
  return result.rows[0];
};

const deleteRoute = async (id) => {
  await pool.query('DELETE FROM routes WHERE id = $1', [id]);
};

const getRoutesByUser = async (userId) => {
  const result = await pool.query('SELECT * FROM routes WHERE user_id = $1', [userId]);
  return result.rows;
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRoutesByUser,
};