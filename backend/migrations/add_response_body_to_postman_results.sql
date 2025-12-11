-- Agregar columna response_body a la tabla postman_results
-- Nota: Si la columna ya existe, este comando generará un error que puede ser ignorado

ALTER TABLE postman_results 
ADD COLUMN response_body TEXT NULL AFTER response_time;

-- Verificar la columna
-- DESCRIBE postman_results;

-- Índice para búsquedas en response_body (opcional)
-- CREATE INDEX idx_response_body ON postman_results(response_body(255));
