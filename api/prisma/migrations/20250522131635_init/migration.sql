-- CreateTable
CREATE TABLE "Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "engineer" TEXT NOT NULL,
    "solarClient" TEXT NOT NULL,
    "solarAlert" BOOLEAN NOT NULL,
    "vsanClient" TEXT NOT NULL,
    "vsanAlert" BOOLEAN NOT NULL
);
