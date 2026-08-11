-- CreateTable
CREATE TABLE "Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comercio" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "registradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
