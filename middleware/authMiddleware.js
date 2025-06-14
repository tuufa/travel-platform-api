const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try 
  {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
	{
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    
    const user = await pool.query('SELECT id FROM users WHERE id = $1', [decoded.id]);
    if (user.rows.length === 0) 
	{
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = { id: decoded.id };
    next();
  } 
  catch (err) 
  {
    console.error('Ошибка аутентификации:', err);
    
    if (err.name === 'TokenExpiredError') 
	{
      return res.status(401).json({ error: 'Срок действия токена истёк' });
    }
    if (err.name === 'JsonWebTokenError') 
	{
      return res.status(401).json({ error: 'Неверный токен' });
    }
    
    return res.status(401).json({ error: 'Ошибка аутентификации' });
  }
};