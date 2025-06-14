const pool = require('../config/db');

pool.query('SELECT 1')
  .then(() => console.log('Подключение к БД успешно'))
  .catch(err => console.error('Ошибка подключения к БД:', err));

module.exports = {
	// Получение маршрута по ID
	getRouteById: async (req, res) => {
		try 
		{
		  const { id } = req.params;
		  
		  const routeResult = await pool.query('SELECT routes.*, users.username as author FROM routes LEFT JOIN users ON routes.user_id = users.id WHERE routes.id = $1', [id]);
		  
		  if (routeResult.rows.length === 0)
		  {
			return res.status(404).json({ error: 'Маршрут не найден' });
		  }
		  
		  const poiResult = await pool.query('SELECT * FROM points_of_interest WHERE route_id = $1 ORDER BY order_in_route', [id]);
		  
		  const reviewsResult = await pool.query(`SELECT reviews.*, users.username FROM reviews JOIN users ON reviews.user_id = users.id WHERE reviews.route_id = $1`,[id]);
		  
		  res.json({...routeResult.rows[0], points_of_interest: poiResult.rows, reviews: reviewsResult.rows});
		  
		} 
		catch (err) 
		{
		  console.error('Ошибка при получении маршрута:', err);
		  res.status(500).json({error: 'Ошибка сервера', details: process.env.NODE_ENV === 'development' ? err.message : undefined});
		}
	},
  
	// Получение всех маршрутов с фильтрацией
	getAllRoutes: async (req, res) => {
		try
		{
		  const { region, difficulty, duration } = req.query;
		  let query = 'SELECT * FROM routes';
		  const params = [];
		  
		  const filters = [];
		  if (region) 
		  {
			params.push(region);
			filters.push(`region = $${params.length}`);
		  }
		  if (difficulty) 
		  {
			params.push(difficulty);
			filters.push(`difficulty = $${params.length}`);
		  }
		  if (duration) 
		  {
			params.push(duration);
			filters.push(`duration_hours <= $${params.length}`);
		  }
		  
		  if (filters.length > 0) 
		  {
			query += ' WHERE ' + filters.join(' AND ');
		  }
		  
		  const result = await pool.query(query, params);
		  res.json(result.rows);
		}
		catch (err) 
		{
		  res.status(500).json({ error: err.message });
		}
	},

	// Создание нового маршрута
	createRoute: async (req, res) => {
		try 
		{
		  const { title, description, duration_hours, difficulty, region } = req.body;
		  const userId = req.user.id; 
		  
		  const result = await pool.query(`INSERT INTO routes (user_id, title, description, duration_hours, difficulty, region) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [userId, title, description, duration_hours, difficulty, region]);
		  
		  res.status(201).json(result.rows[0]);
		} 
		catch (err) 
		{
		  res.status(500).json({ error: err.message });
		}
	},

	// Получение данных таблицы
	getTableData: async (req, res) => {
		try
		{
		  const { tableName } = req.params;
		  const allowedTables = ['users', 'routes', 'points_of_interest', 'reviews', 'collections', 'collection_routes'];

		  if (!allowedTables.includes(tableName)) 
		  {
			return res.status(400).json({ error: 'Invalid table name' });
		  }

		  const result = await pool.query(`SELECT * FROM ${tableName}`);
		  res.json(result.rows);
		} 
		catch (err)
		{
		  console.error('DB query error:', err);
		  res.status(500).json({ error: 'Database error' });
		}
	},

	// Добавление точки интереса
	createPointOfInterest: async (req, res) => {
		try 
		{
			const { route_id, name, description, latitude, longitude, order_in_route } = req.body;
			const userId = req.user.id;

			const routeResult = await pool.query('SELECT id FROM routes WHERE id = $1', [route_id]);

			if (routeResult.rows.length === 0)
			{
				return res.status(404).json({ error: 'Маршрут не найден' });
			}

			const result = await pool.query(`INSERT INTO points_of_interest (route_id, name, description, latitude, longitude, order_in_route) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [route_id, name, description, latitude, longitude, order_in_route]);

			res.status(201).json(result.rows[0]);
		} 
		catch (err) 
		{
			res.status(500).json({ error: err.message });
		}
	},

	// Добавление отзыва
	createReview: async (req, res) => {
		try
		{
			const { route_id, rating, comment } = req.body;
			const userId = req.user.id;

			const routeResult = await pool.query('SELECT id FROM routes WHERE id = $1', [route_id]);

			if (routeResult.rows.length === 0)
			{
				return res.status(404).json({ error: 'Маршрут не найден' });
			}

			const result = await pool.query(`INSERT INTO reviews (user_id, route_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`, [userId, route_id, rating, comment]);

			res.status(201).json(result.rows[0]);
		}
		catch (err) 
		{
			res.status(500).json({ error: err.message });
		}
	},

	// Добавление коллекции
	createCollection: async (req, res) => {
		try
		{
			const { name, description, is_public, route_ids } = req.body;
			const userId = req.user.id;

			const collectionResult = await pool.query(`INSERT INTO collections (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *`, [userId, name, description, is_public]);

			const collectionId = collectionResult.rows[0].id;

			if (route_ids && route_ids.length > 0) 
			{
				for (const routeId of route_ids)
				{
					await pool.query(`INSERT INTO collection_routes (collection_id, route_id) VALUES ($1, $2)`,[collectionId, routeId]);
				}
			}

			res.status(201).json(collectionResult.rows[0]);
		}
		catch (err) 
		{
			res.status(500).json({ error: err.message });
		}
	},

	// Добавление маршрута в коллекцию
	addRouteToCollection: async (req, res) => {
		try 
		{
			const { collection_name, route_title } = req.body;
			const userId = req.user.id;

			const collectionResult = await pool.query('SELECT id FROM collections WHERE name = $1 AND user_id = $2', [collection_name, userId]);

			if (collectionResult.rows.length === 0)
				{
				return res.status(404).json({ error: 'Коллекция не найдена или нет доступа' });
			}

			const routeResult = await pool.query('SELECT id FROM routes WHERE title = $1', [route_title]);

			if (routeResult.rows.length === 0) 
			{
				return res.status(404).json({ error: 'Маршрут не найден' });
			}

			const collectionId = collectionResult.rows[0].id;
			const routeId = routeResult.rows[0].id;

			const existsResult = await pool.query('SELECT * FROM collection_routes WHERE collection_id = $1 AND route_id = $2', [collectionId, routeId]);

			if (existsResult.rows.length > 0) 
			{
				return res.status(400).json({ error: 'Маршрут уже в коллекции' });
			}

			const result = await pool.query(`INSERT INTO collection_routes (collection_id, route_id) VALUES ($1, $2) RETURNING *`, [collectionId, routeId]);

			res.status(201).json(result.rows[0]);
		} 
		catch (err) 
		{
			res.status(500).json({ error: err.message });
		}
	},

	// Редактирование записи
	updateRecord: async (req, res) => {
		try
		{
			const { tableName, id } = req.params;
			const updates = req.body;
			const userId = req.user.id;

			if (tableName === 'reviews') 
			{
				if (updates.rating && (updates.rating < 1 || updates.rating > 5)) 
				{
					return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
				}
			}

			if (tableName === 'reviews') 
			{
				const reviewCheck = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [id]);
				
				if (reviewCheck.rows.length === 0) 
				{
					return res.status(404).json({ error: 'Отзыв не найден' });
				}

				if (reviewCheck.rows[0].user_id !== userId) 
				{
					return res.status(403).json({ error: 'Вы можете редактировать только свои отзывы' });
				}
			}

			const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');

			const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${Object.keys(updates).length + 1} RETURNING *`;
			const values = [...Object.values(updates), id];

			const result = await pool.query(query, values);

			if (result.rows.length === 0) 
			{
				return res.status(404).json({ error: 'Запись не найдена' });
			}

			res.json(result.rows[0]);
		} 
		catch (err) 
		{
			res.status(500).json({error: 'Ошибка сервера', details: process.env.NODE_ENV === 'development' ? err.message : undefined});
		}
	},

	// Удаление записи
	deleteRecord: async (req, res) => {
		try 
		{
		  const { tableName, id } = req.params;
		  const userId = req.user.id;

		  const allowedTables = ['routes', 'points_of_interest', 'reviews', 'collections'];
		  if (!allowedTables.includes(tableName)) 
		  {
			return res.status(400).json({ error: 'Недопустимая таблица' });
		  }

		  if (tableName === 'routes' || tableName === 'collections') 
		  {
			const ownerCheck = await pool.query(`SELECT user_id FROM ${tableName} WHERE id = $1`, [id]);
			
			if (ownerCheck.rows.length === 0) 
			{
			  return res.status(404).json({ error: 'Запись не найдена' });
			}

			if (ownerCheck.rows[0].user_id !== userId)
				{
			  return res.status(403).json({ error: 'Нет прав на удаление' });
			}
		  }

		  const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);

		  if (result.rows.length === 0) 
		  {
			return res.status(404).json({ error: 'Запись не найдена' });
		  }

		  res.json({ message: 'Запись удалена', deleted: result.rows[0] });
		}
		catch (err) 
		{
		  res.status(500).json({ error: err.message });
		}
	},

  // Получение записи для редактирования
	getRecordForEdit: async (req, res) => {
	  try
	  {
		const { tableName, id } = req.params;
		const userId = req.user.id; 

		const allowedTables = ['routes', 'points_of_interest', 'reviews', 'collections'];
		
		if (tableName === 'users') 
		{
		  if (parseInt(id) !== userId) 
		  {
			return res.status(403).json({ error: 'Вы можете редактировать только свой профиль' });
		  }
		} 
		else if (!allowedTables.includes(tableName)) 
		{
		  return res.status(400).json({ error: 'Недопустимая таблица' });
		}

		const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);

		if (result.rows.length === 0) 
		{
		  return res.status(404).json({ error: 'Запись не найдена' });
		}

		res.json(result.rows[0]);
	  } 
	  catch (err) 
	  {
		res.status(500).json({ error: err.message });
	  }
	}
};