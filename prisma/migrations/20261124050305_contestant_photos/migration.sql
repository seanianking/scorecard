-- AlterTable
ALTER TABLE "Contestant" ADD COLUMN "photoKey" TEXT;
ALTER TABLE "Contestant" ADD COLUMN "photoUpdatedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pageant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "eventDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SETUP',
    "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
    "requirePhoto" BOOLEAN NOT NULL DEFAULT false,
    "directorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pageant_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pageant" ("createdAt", "description", "directorId", "eventDate", "id", "location", "name", "resultsPublished", "status", "updatedAt") SELECT "createdAt", "description", "directorId", "eventDate", "id", "location", "name", "resultsPublished", "status", "updatedAt" FROM "Pageant";
DROP TABLE "Pageant";
ALTER TABLE "new_Pageant" RENAME TO "Pageant";
CREATE INDEX "Pageant_directorId_idx" ON "Pageant"("directorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
