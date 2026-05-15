ALTER TABLE "Appointment" ADD COLUMN "previousDate" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "previousTime" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "rescheduledAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "noShowAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "adminNote" TEXT;
