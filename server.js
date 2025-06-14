require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

console.log('Конфигурация среды:');
console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
console.log(`База данных: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

app.use(helmet({contentSecurityPolicy: {directives: {...helmet.contentSecurityPolicy.getDefaultDirectives(),"script-src": ["'self'", "'unsafe-inline'"], "script-src-attr": ["'self'", "'unsafe-inline'"] }}}));
app.use(cors({origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'DELETE']}));

const limiter = rateLimit({windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.path}`); next();});

app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.get('/api/health', (req, res) => {res.json({tatus: 'OK', db: process.env.DB_HOST, jwt: process.env.JWT_SECRET ? 'configured' : 'missing'});});

app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use((err, req, res, next) => {console.error(err.stack); res.status(500).json({ error: 'Внутренняя ошибка сервера' });});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  Сервер успешно запущен!
  Порт: ${PORT}
  База данных: postgres://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
  `);
});