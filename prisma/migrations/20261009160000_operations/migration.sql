-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "serviceId" TEXT;

UPDATE "Appointment" SET "endsAt" = "startsAt" + "duration" * INTERVAL '1 minute';
ALTER TABLE "Appointment" ALTER COLUMN "endsAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "job" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeService" (
    "instituteId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "EmployeeService_pkey" PRIMARY KEY ("instituteId","employeeId","serviceId")
);

-- CreateTable
CREATE TABLE "EmployeeSchedule" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAbsence" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EmployeeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_memberId_key" ON "Employee"("memberId");

-- CreateIndex
CREATE INDEX "Employee_instituteId_active_idx" ON "Employee"("instituteId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_instituteId_memberId_key" ON "Employee"("instituteId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_instituteId_id_key" ON "Employee"("instituteId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSchedule_instituteId_employeeId_weekday_key" ON "EmployeeSchedule"("instituteId", "employeeId", "weekday");

-- CreateIndex
CREATE INDEX "EmployeeAbsence_instituteId_employeeId_startsAt_idx" ON "EmployeeAbsence"("instituteId", "employeeId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Member_instituteId_id_key" ON "Member"("instituteId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_instituteId_id_key" ON "Service"("instituteId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_instituteId_id_key" ON "Client"("instituteId", "id");

-- CreateIndex
CREATE INDEX "Appointment_instituteId_employeeId_startsAt_idx" ON "Appointment"("instituteId", "employeeId", "startsAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_instituteId_employeeId_fkey" FOREIGN KEY ("instituteId", "employeeId") REFERENCES "Employee"("instituteId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_instituteId_clientId_fkey" FOREIGN KEY ("instituteId", "clientId") REFERENCES "Client"("instituteId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_instituteId_serviceId_fkey" FOREIGN KEY ("instituteId", "serviceId") REFERENCES "Service"("instituteId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_instituteId_memberId_fkey" FOREIGN KEY ("instituteId", "memberId") REFERENCES "Member"("instituteId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_instituteId_employeeId_fkey" FOREIGN KEY ("instituteId", "employeeId") REFERENCES "Employee"("instituteId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_instituteId_serviceId_fkey" FOREIGN KEY ("instituteId", "serviceId") REFERENCES "Service"("instituteId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_instituteId_employeeId_fkey" FOREIGN KEY ("instituteId", "employeeId") REFERENCES "Employee"("instituteId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_instituteId_employeeId_fkey" FOREIGN KEY ("instituteId", "employeeId") REFERENCES "Employee"("instituteId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Garanties SQL : créneaux valides et isolation des disponibilités.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_valid_interval" CHECK ("endsAt" > "startsAt");
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "schedule_valid_hours" CHECK ("weekday" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "endMinute" > "startMinute");
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "absence_valid_interval" CHECK ("endsAt" > "startsAt");
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_no_staff_overlap"
EXCLUDE USING gist ("instituteId" WITH =, "employeeId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&)
WHERE ("employeeId" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'NO_SHOW'));
