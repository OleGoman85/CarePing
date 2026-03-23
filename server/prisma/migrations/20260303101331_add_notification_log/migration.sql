-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "contactId" TEXT,
    "channel" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    CONSTRAINT "NotificationLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CheckInEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
