const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

const checkControllerMethods = () => {
  console.log('Доступные методы контроллера:', Object.keys(routeController));
  if (!routeController.getRouteById) {
    console.error('ОШИБКА: Метод getRouteById отсутствует в контроллере!');
  }
};

// Проверяем методы при запуске
checkControllerMethods();

// Публичные маршруты
router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);

// Защищенные маршруты
router.post('/', authMiddleware, routeController.createRoute);
router.put('/:id', authMiddleware, (req, res) => {req.params.tableName = 'routes'; routeController.updateRecord(req, res);});
router.delete('/:id', authMiddleware, (req, res) => {req.params.tableName = 'routes'; routeController.deleteRecord(req, res);});

// Работа с таблицами БД
router.get('/db/:tableName', authMiddleware, routeController.getTableData);

// Точки интереса
router.post('/pois', authMiddleware, routeController.createPointOfInterest);

// Отзывы
router.post('/reviews', authMiddleware, routeController.createReview);
router.put('/reviews/:id', authMiddleware, (req, res) => {req.params.tableName = 'reviews'; routeController.updateRecord(req, res);});

// Коллекции
router.post('/collections', authMiddleware, routeController.createCollection);

// Маршруты в коллекциях
router.post('/collection-routes', authMiddleware, routeController.addRouteToCollection);

// Общие операции с записями
router.put('/:tableName/:id', authMiddleware, routeController.updateRecord);
router.delete('/:tableName/:id', authMiddleware, routeController.deleteRecord);
router.get('/:tableName/edit/:id', authMiddleware, routeController.getRecordForEdit);

module.exports = router;