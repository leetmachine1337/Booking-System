const express = require('express');
const router = express.Router();
const { createSchedule, getStoreSchedule } = require('../controllers/scheduleController');

// створення розкладу
router.post('/', createSchedule);

// отримати розклад магазину
router.get('/:storeId', getStoreSchedule);

module.exports = router;
