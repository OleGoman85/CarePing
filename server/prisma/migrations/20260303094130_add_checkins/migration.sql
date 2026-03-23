-- CreateTable
CREATE TABLE "CheckInEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "planId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "confirmedAt" DATETIME,
    "escalatedAt" DATETIME,
    CONSTRAINT "CheckInEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
