const prisma = require('../prisma');

const BLOCKING_APPOINTMENT_STATUSES = ["active", "completed", "no_show"];

const parseLocalDate = (date) => {
  if (!date || typeof date !== 'string') return null;
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getSlotDateTime = (date, time) => {
  const day = parseLocalDate(date);
  if (!day || !time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  day.setHours(hours, minutes, 0, 0);
  return day;
};

const isPastSlot = (date, time) => {
  const slotDateTime = getSlotDateTime(date, time);
  return !slotDateTime || slotDateTime <= new Date();
};

const getBookingMaxDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 2, 0);
};

const isBeyondBookingWindow = (date) => {
  const day = parseLocalDate(date);
  if (!day) return true;

  day.setHours(0, 0, 0, 0);
  const maxDate = getBookingMaxDate();
  maxDate.setHours(23, 59, 59, 999);

  return day > maxDate;
};

// Створення запису
async function createAppointment(req, res) {
  try {
    const { userId, storeId, date, time } = req.body;

    if (!userId || !storeId || !date || !time) {
      return res.status(400).json({ error: "userId, storeId, date and time are required" });
    }

    const [year, month, day] = date.split('-');
    const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0 = неділя, 6 = субота

    if (isBeyondBookingWindow(date)) {
      return res.status(400).json({ error: "Selected date is outside the booking window" });
    }

    if (isPastSlot(date, time)) {
      return res.status(400).json({ error: "Selected time has already passed" });
    }

    // Перевіряємо розклад магазину
    const schedule = await prisma.workSchedule.findFirst({
      where: { storeId, dayOfWeek }
    });

    if (!schedule || schedule.isDayOff) {
      return res.status(400).json({ error: "Store is closed on this day" });
    }

    if (time < schedule.startTime || time >= schedule.endTime) {
      return res.status(400).json({ error: "Selected time is outside store working hours" });
    }

    // Перевіряємо, чи слот вільний
    const existing = await prisma.appointment.findFirst({
      where: {
        storeId,
        date: new Date(date),
        time,
        status: { in: BLOCKING_APPOINTMENT_STATUSES },
      }
    });

    if (existing) {
      return res.status(400).json({ error: "This time slot is already taken" });
    }

    // Створюємо запис
    const appointment = await prisma.appointment.create({
      data: { userId, storeId, date: new Date(date), time, status: "active" },
    });

    res.json(appointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// Отримати записи користувача
async function getUserAppointments(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.user?.userId);
    if (!userId) return res.status(400).json({ error: "userId required" });

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { date: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// Отримати доступні слоти
async function getAvailableSlots(req, res) {
  try {
    const { storeId, date } = req.query;
    if (!storeId || !date) {
      return res.status(400).json({ error: "storeId and date are required" });
    }

    const [year, month, day] = date.split('-');
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    if (isBeyondBookingWindow(date)) {
      return res.status(400).json({ error: "Selected date is outside the booking window" });
    }

    const schedule = await prisma.workSchedule.findFirst({
      where: { storeId: parseInt(storeId), dayOfWeek }
    });

    if (!schedule || schedule.isDayOff) {
      return res.json({ isDayOff: true, slots: [] });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        storeId: parseInt(storeId),
        date: new Date(date),
        status: { in: BLOCKING_APPOINTMENT_STATUSES },
      },
      select: { time: true }
    });

    const bookedSlots = appointments.map(a => a.time);

    // Генеруємо слоти по 15 хв
    const slots = [];
    let current = schedule.startTime; // "09:00"

    while (current < schedule.endTime) {
      slots.push({
        time: current,
        available: !bookedSlots.includes(current) && !isPastSlot(date, current)
      });

      // Додаємо 15 хв
      const [hours, minutes] = current.split(':').map(Number);
      let newMinutes = minutes + 15;
      let newHours = hours;
      if (newMinutes >= 60) {
        newMinutes = 0;
        newHours += 1;
      }
      current = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    }

    res.json({ isDayOff: false, slots });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
}

module.exports = { createAppointment, getUserAppointments, getAvailableSlots };
