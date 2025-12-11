-- Migración: Agregar project_id y test_type a playwright_results
-- Fecha: 11 de Noviembre 2025
-- Propósito: Permitir filtrar resultados de Playwright por proyecto y tipo de prueba

-- Agregar columna project_id
ALTER TABLE playwright_results 
ADD COLUMN IF NOT EXISTS project_id VARCHAR(100) NULL AFTER id;

-- Agregar columna test_type
ALTER TABLE playwright_results 
ADD COLUMN IF NOT EXISTS test_type ENUM('contract', 'controlled_response', 'response') NULL AFTER project_id;

-- Crear índices para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_project_id ON playwright_results(project_id);
CREATE INDEX IF NOT EXISTS idx_test_type ON playwright_results(test_type);
CREATE INDEX IF NOT EXISTS idx_project_test ON playwright_results(project_id, test_type);

-- Opcional: Actualizar registros existentes con proyecto por defecto
UPDATE playwright_results 
SET project_id = 'YAMAHA' 
WHERE project_id IS NULL;

-- Actualizar test_type por defecto
UPDATE playwright_results 
SET test_type = 'response' 
WHERE test_type IS NULL;
