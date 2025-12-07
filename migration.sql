-- migration A (initial)
CREATE TABLE public.entities (
  id serial PRIMARY KEY,
  title text NOT NULL,
  amount numeric NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- migration B (add two fields)
ALTER TABLE public.entities
  ADD COLUMN status text,
  ADD COLUMN due_date date;
