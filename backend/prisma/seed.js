const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    // Clear existing
    await prisma.appointment.deleteMany();
    await prisma.workSchedule.deleteMany();
    await prisma.store.deleteMany();

    const adminUsername = (process.env.ADMIN_LOGIN || 'admin').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { username: adminUsername },
        update: {
            password: hashedAdminPassword,
            role: 'ADMIN',
        },
        create: {
            username: adminUsername,
            password: hashedAdminPassword,
            role: 'ADMIN',
        },
    });

    const stores = [
        { name: "Main City Store", address: "Shevchenko St, 10" },
        { name: "Station Branch", address: "Vokzalna St, 5" },
        { name: "Mall Point", address: "Ocean Plaza, 2nd Floor" },
    ];

    for (const s of stores) {
        const store = await prisma.store.create({ data: s });

        // Add schedule 9:00 - 18:00 for Mon-Fri (1-5)
        for (let day = 1; day <= 5; day++) {
            await prisma.workSchedule.create({
                data: {
                    storeId: store.id,
                    dayOfWeek: day,
                    startTime: "09:00",
                    endTime: "18:00",
                    isDayOff: false
                }
            });
        }
        // Sat-Sun (6, 0) as day off
        for (const day of [0, 6]) {
            await prisma.workSchedule.create({
                data: {
                    storeId: store.id,
                    dayOfWeek: day,
                    startTime: "00:00",
                    endTime: "00:00",
                    isDayOff: true
                }
            });
        }
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
