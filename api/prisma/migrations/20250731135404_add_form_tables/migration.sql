-- CreateTable
CREATE TABLE "CheckpointSubmission" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "alertStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "reference" TEXT NOT NULL,

    CONSTRAINT "CheckpointSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointAlert" (
    "id" SERIAL NOT NULL,
    "checkpointId" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "CheckpointAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeeamSubmission" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer" TEXT NOT NULL,
    "vbrHost" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "VeeamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VmwareSubmission" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "alert" BOOLEAN NOT NULL,

    CONSTRAINT "VmwareSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CheckpointAlert" ADD CONSTRAINT "CheckpointAlert_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "CheckpointSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
