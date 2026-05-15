const prisma = require('../prisma');

// створити розклад для магазину
async function createSchedule(req, res) {
  try {
    const { storeId, dayOfWeek, startTime, endTime, isDayOff } = req.body;

    if (storeId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: "storeId, dayOfWeek, startTime and endTime are required" });
    }

    const schedule = await prisma.workSchedule.create({
      data: { storeId, dayOfWeek, startTime, endTime, isDayOff: isDayOff || false },
    });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// отримати розклад магазину
async function getStoreSchedule(req, res) {
  try {
    const storeId = parseInt(req.params.storeId);
    if (!storeId) return res.status(400).json({ error: "storeId required" });

    const schedule = await prisma.workSchedule.findMany({
      where: { storeId },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { createSchedule, getStoreSchedule };
