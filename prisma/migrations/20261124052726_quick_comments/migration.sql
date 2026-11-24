-- CreateTable
CREATE TABLE "QuickComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageantId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuickComment_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuickComment_pageantId_idx" ON "QuickComment"("pageantId");
