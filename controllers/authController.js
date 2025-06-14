// controllers/authController.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authController = {
    login: async (req, res) => {
        try 
		{
            const { email, password } = req.body;
            
            const user = await pool.query('SELECT id FROM users WHERE email = $1 AND password_hash = $2',  [email, password]);

            if (!user.rows[0]) {
                return res.status(401).json({ error: 'Неверные данные' });
            }

            const token = jwt.sign(
                { id: user.rows[0].id },
                process.env.JWT_SECRET || 'default-secret-key', 
                { expiresIn: '24h' }
            );

            res.json({token, userId: user.rows[0].id, message: 'Вход выполнен успешно' });
        }
		catch (err) 
		{
            console.error('Ошибка входа:', err);
            res.status(500).json({ error: 'Ошибка сервера при входе' });
        }
    },

    register: async (req, res) => {
        try 
		{
            const { email, password, username } = req.body;

            const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (emailExists.rows.length > 0) 
			{
                return res.status(400).json({ error: 'Email уже занят' });
            }

            const usernameExists = await pool.query('SELECT id FROM users WHERE username = $1',  [username]);
            if (usernameExists.rows.length > 0) 
			{
                return res.status(400).json({ error: 'Имя пользователя уже занято' });
            }

            const newUser = await pool.query('INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id', [email, password, username]);

            const token = jwt.sign( { id: newUser.rows[0].id }, process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '24h' });

            res.status(201).json({  token,  userId: newUser.rows[0].id, message: 'Регистрация прошла успешно'});
        } 
		catch (err) 
		{
            console.error('Ошибка регистрации:', err);
            res.status(500).json({ error: 'Ошибка сервера при регистрации' });
        }
    },

    getPreferences: async (req, res) => {
        try 
		{
            const result = await pool.query('SELECT preferences FROM users WHERE id = $1', [req.user.id]);
            res.json({ preferences: result.rows[0].preferences || {} });
        } 
		catch (err) 
		{
            console.error('Ошибка получения настроек:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    },

    updatePreferences: async (req, res) => {
        try 
		{
            await pool.query('UPDATE users SET preferences = $1 WHERE id = $2', [req.body.preferences, req.user.id]);
            res.json({ message: 'Настройки обновлены' });
        } 
		catch (err) 
		{
            console.error('Ошибка обновления настроек:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
};

module.exports = authController;