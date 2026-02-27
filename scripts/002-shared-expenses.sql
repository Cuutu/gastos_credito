-- Gastos compartidos: varias personas dividen el monto

-- Tabla de relación expense <-> persons (para gastos compartidos)
CREATE TABLE IF NOT EXISTS expense_persons (
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  share NUMERIC(5, 4) NOT NULL DEFAULT 1 CHECK (share > 0 AND share <= 1),
  PRIMARY KEY (expense_id, person_id)
);

-- Agregar person_id a installments (cada cuota puede estar asignada a una persona)
ALTER TABLE expense_installments
  ADD COLUMN IF NOT EXISTS person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE;

-- Backfill: asignar person_id de expense a installments existentes
UPDATE expense_installments ei
SET person_id = e.person_id
FROM expenses e
WHERE ei.expense_id = e.id AND ei.person_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_expense_persons_expense_id ON expense_persons(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_installments_person_id ON expense_installments(person_id);
