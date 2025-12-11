-- Agregar campo input_data a test_cases
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS input_data TEXT AFTER preconditions;
