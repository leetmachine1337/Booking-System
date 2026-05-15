const express = require('express');
const router = express.Router();
const { createAppointment, getUserAppointments } = require('../controllers/appointmentController');

// створити запис
router.post('/', createAppointment);

// отримати записи користувача
router.get('/user/:userId', getUserAppointments);

module.exports = router;
