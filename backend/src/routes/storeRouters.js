const express = require('express');
const router = express.Router();
const { createStore, getStores } = require('../controllers/storeController');
const { getAvailableSlots } = require('../controllers/appointmentController');

router.post('/', createStore);
router.get('/', getStores);
router.get('/:id/slots', getAvailableSlots);

module.exports = router;
