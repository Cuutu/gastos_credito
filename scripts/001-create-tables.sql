-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  merchant VARCHAR(255) NOT NULL,
  amount_total NUMERIC(12, 2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1 CHECK (installments >= 1),
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL,
  card VARCHAR(255),
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_installments table
CREATE TABLE IF NOT EXISTS expense_installments (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_person_id ON expenses(person_id);
CREATE INDEX IF NOT EXISTS idx_expenses_purchase_date ON expenses(purchase_date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_installments_expense_id ON expense_installments(expense_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_month ON expense_installments(due_month);

-- Seed data: default persons
INSERT INTO persons (name) VALUES ('Sabrina'), ('Pareja'), ('Casa')
ON CONFLICT (name) DO NOTHING;
