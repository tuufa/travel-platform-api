const pool = require('../config/db');

const generatePersonalizedRoutes = async (userId) => {
  const userRes = await pool.query('SELECT preferences FROM users WHERE id = $1', [userId]);
  const preferences = userRes.rows[0]?.preferences || {};
  
  let query = 'SELECT * FROM routes WHERE 1=1';
  const params = [];
  
  if (preferences.region) {
    query += ` AND region = $${params.length + 1}`;
    params.push(preferences.region);
  }
  
  if (preferences.difficulty) {
    query += ` AND difficulty = $${params.length + 1}`;
    params.push(preferences.difficulty);
  }
  
  if (preferences.maxDuration) {
    query += ` AND duration_hours <= $${params.length + 1}`;
    params.push(preferences.maxDuration);
  }
  
  query += `
    UNION
    SELECT r.* FROM routes r
    JOIN reviews rev ON r.id = rev.route_id
    GROUP BY r.id
    HAVING AVG(rev.rating) >= 4
    ORDER BY AVG(rev.rating) DESC
    LIMIT 5
  `;
  
  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = { generatePersonalizedRoutes };