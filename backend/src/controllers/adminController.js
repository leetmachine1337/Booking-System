const prisma = require('../prisma');

const BLOCKING_APPOINTMENT_STATUSES = ["active", "completed", "no_show"];

const parseDateParts = (date) => {
  if (!date || typeof date !== 'string') return null;
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;

  return {
    year,
    month,
    day,
    localValue: new Date(year, month - 1, day),
    value: new Date(date),
  };
};

const getSlotDateTime = (date, time) => {
  const parsedDate = parseDateParts(date);
  if (!parsedDate || !time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  parsedDate.localValue.setHours(hours, minutes, 0, 0);
  return parsedDate.localValue;
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
  const parsedDate = parseDateParts(date);
  if (!parsedDate) return true;

  parsedDate.localValue.setHours(0, 0, 0, 0);
  const maxDate = getBookingMaxDate();
  maxDate.setHours(23, 59, 59, 999);

  return parsedDate.localValue > maxDate;
};

const validateAppointmentSlot = async ({ appointmentId, storeId, date, time }) => {
  const parsedDate = parseDateParts(date);
  if (!storeId || !parsedDate || !time) {
    return { error: "storeId, date and time are required" };
  }

  if (isBeyondBookingWindow(date)) {
    return { error: "Selected date is outside the booking window" };
  }

  if (isPastSlot(date, time)) {
    return { error: "Selected time has already passed" };
  }

  const dayOfWeek = parsedDate.localValue.getDay();
  const schedule = await prisma.workSchedule.findFirst({
    where: { storeId, dayOfWeek },
  });

  if (!schedule || schedule.isDayOff) {
    return { error: "Store is closed on this day" };
  }

  if (time < schedule.startTime || time >= schedule.endTime) {
    return { error: "Selected time is outside store working hours" };
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      storeId,
      date: parsedDate.value,
      time,
      status: { in: BLOCKING_APPOINTMENT_STATUSES },
      NOT: appointmentId ? { id: appointmentId } : undefined,
    },
  });

  if (existing) {
    return { error: "This time slot is already taken" };
  }

  return { dateValue: parsedDate.value };
};

// отримати всі записи
async function getAllAppointments(req, res) {
  try {
    const storeId = req.query.storeId ? parseInt(req.query.storeId) : undefined;
    const parsedDate = parseDateParts(req.query.date);

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        ...(parsedDate ? { date: parsedDate.value } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
          },
        },
        store: true,
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// скасувати запис
async function cancelAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Appointment id required" });

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        adminNote: req.body?.adminNote || null,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

async function rescheduleAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { date, time, adminNote } = req.body;
    if (!id) return res.status(400).json({ error: "Appointment id required" });

    const currentAppointment = await prisma.appointment.findUnique({ where: { id } });
    if (!currentAppointment) return res.status(404).json({ error: "Appointment not found" });

    const validation = await validateAppointmentSlot({
      appointmentId: id,
      storeId: currentAppointment.storeId,
      date,
      time,
    });

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: validation.dateValue,
        time,
        status: "active",
        previousDate: currentAppointment.date,
        previousTime: currentAppointment.time,
        rescheduledAt: new Date(),
        adminNote: adminNote || null,
      },
      include: {
        user: { select: { id: true, phone: true, username: true } },
        store: true,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

async function completeAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Appointment id required" });

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        adminNote: req.body?.adminNote || null,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

async function markNoShowAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Appointment id required" });

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "no_show",
        noShowAt: new Date(),
        adminNote: req.body?.adminNote || null,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// редагування розкладу магазину
async function editSchedule(req, res) {
  try {
    const { scheduleId, startTime, endTime, isDayOff } = req.body;
    if (!scheduleId) return res.status(400).json({ error: "scheduleId required" });

    const schedule = await prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { startTime, endTime, isDayOff },
    });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  getAllAppointments,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShowAppointment,
  editSchedule,
};
