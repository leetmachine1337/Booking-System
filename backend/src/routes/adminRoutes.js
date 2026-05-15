const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShowAppointment,
  editSchedule,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

// всі записи
router.get('/appointments', getAllAppointments);

// скасувати запис
router.patch('/appointments/:id/cancel', cancelAppointment);

// перенести запис
router.patch('/appointments/:id/reschedule', rescheduleAppointment);

// клієнт успішно обслужений
router.patch('/appointments/:id/complete', completeAppointment);

// клієнт не зʼявився
router.patch('/appointments/:id/no-show', markNoShowAppointment);

// редагувати розклад
router.patch('/schedule', editSchedule);

module.exports = router;
