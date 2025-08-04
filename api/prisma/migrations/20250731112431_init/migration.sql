-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer" TEXT NOT NULL,
    "solarClient" TEXT NOT NULL,
    "solarAlert" BOOLEAN NOT NULL,
    "vsanClient" TEXT NOT NULL,
    "vsanAlert" BOOLEAN NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
