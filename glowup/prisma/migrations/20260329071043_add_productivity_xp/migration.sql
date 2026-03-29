-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "carriedOver" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Goal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'work',
    "completedAt" DATETIME,
    CONSTRAINT "FocusSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SleepLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "quality" INTEGER NOT NULL,
    CONSTRAINT "SleepLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "glasses" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WaterLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    CONSTRAINT "WeeklyReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XPLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "XPLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Goal_sessionId_dateKey_idx" ON "Goal"("sessionId", "dateKey");

-- CreateIndex
CREATE INDEX "FocusSession_sessionId_idx" ON "FocusSession"("sessionId");

-- CreateIndex
CREATE INDEX "SleepLog_sessionId_idx" ON "SleepLog"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SleepLog_sessionId_dateKey_key" ON "SleepLog"("sessionId", "dateKey");

-- CreateIndex
CREATE INDEX "WaterLog_sessionId_idx" ON "WaterLog"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_sessionId_dateKey_key" ON "WaterLog"("sessionId", "dateKey");

-- CreateIndex
CREATE INDEX "WeeklyReview_sessionId_idx" ON "WeeklyReview"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_sessionId_weekKey_key" ON "WeeklyReview"("sessionId", "weekKey");

-- CreateIndex
CREATE INDEX "XPLog_sessionId_idx" ON "XPLog"("sessionId");
