const prisma = require('../prisma');

// створення магазину
async function createStore(req, res) {
  try {
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const store = await prisma.store.create({
      data: { name, address },
    });

    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

// отримати всі магазини
async function getStores(req, res) {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { createStore, getStores };
