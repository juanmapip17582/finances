-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comercio" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "registradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Gasto" ("categoria", "comercio", "fecha", "id", "monto", "registradoEn") SELECT "categoria", "comercio", "fecha", "id", "monto", "registradoEn" FROM "Gasto";
DROP TABLE "Gasto";
ALTER TABLE "new_Gasto" RENAME TO "Gasto";
CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
