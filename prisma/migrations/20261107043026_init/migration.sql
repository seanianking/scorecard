-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pageant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "eventDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SETUP',
    "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
    "directorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pageant_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgeGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AgeGroup_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SHORT_TEXT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Question_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Event_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "weight" REAL NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Criterion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL,
    "singleUse" BOOLEAN NOT NULL DEFAULT true,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contestant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ageGroupId" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" DATETIME,
    "contestantNumber" INTEGER,
    "registeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contestant_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contestant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contestant_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contestantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "Answer_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Judge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Judge_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Judge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judgeId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Score_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judgeId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feedback_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Pageant_directorId_idx" ON "Pageant"("directorId");

-- CreateIndex
CREATE INDEX "AgeGroup_pageantId_idx" ON "AgeGroup"("pageantId");

-- CreateIndex
CREATE INDEX "Question_pageantId_idx" ON "Question"("pageantId");

-- CreateIndex
CREATE INDEX "Event_pageantId_idx" ON "Event"("pageantId");

-- CreateIndex
CREATE INDEX "Criterion_eventId_idx" ON "Criterion"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_pageantId_idx" ON "Invite"("pageantId");

-- CreateIndex
CREATE INDEX "Contestant_ageGroupId_idx" ON "Contestant"("ageGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Contestant_pageantId_userId_key" ON "Contestant"("pageantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_contestantId_questionId_key" ON "Answer"("contestantId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Judge_pageantId_userId_key" ON "Judge"("pageantId", "userId");

-- CreateIndex
CREATE INDEX "Score_contestantId_idx" ON "Score"("contestantId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_judgeId_contestantId_criterionId_key" ON "Score"("judgeId", "contestantId", "criterionId");

-- CreateIndex
CREATE INDEX "Feedback_contestantId_idx" ON "Feedback"("contestantId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_judgeId_contestantId_eventId_key" ON "Feedback"("judgeId", "contestantId", "eventId");
