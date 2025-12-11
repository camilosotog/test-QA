-- Script de diagnóstico para verificar las evidencias guardadas en BD
-- Ejecutar este script en tu cliente MySQL para diagnosticar el problema

-- 1. Ver el último resultado guardado con evidencias
SELECT 
  tr.id,
  tr.test_case_id,
  tr.test_execution_id,
  tr.result_status,
  tr.notes,
  tr.evidence_urls,
  tr.tester_name,
  tr.qa_tested_by,
  tr.created_at,
  tr.executed_at
FROM test_results tr
WHERE tr.evidence_urls IS NOT NULL
ORDER BY tr.created_at DESC
LIMIT 10;

-- 2. Ver estructura de una URL específica
SELECT 
  tr.id,
  tr.test_case_id,
  CHAR_LENGTH(tr.evidence_urls) as url_length,
  tr.evidence_urls as urls_raw
FROM test_results tr
WHERE tr.evidence_urls IS NOT NULL
LIMIT 5;

-- 3. Contar cuántas evidencias hay por resultado
SELECT 
  tr.id,
  tr.test_case_id,
  tr.test_execution_id,
  (CHAR_LENGTH(tr.evidence_urls) - CHAR_LENGTH(REPLACE(tr.evidence_urls, 'https://', '')) ) / 8 as url_count,
  tr.evidence_urls
FROM test_results tr
WHERE tr.evidence_urls IS NOT NULL
ORDER BY tr.created_at DESC;

-- 4. Ver un resultado específico y sus casos
SELECT 
  tc.id as case_id,
  tc.name as case_name,
  tr.id as result_id,
  tr.result_status,
  tr.notes,
  tr.evidence_urls,
  COALESCE(tr.evidence_urls IS NOT NULL AND tr.evidence_urls != '[]' AND tr.evidence_urls != 'null', false) as has_evidence
FROM test_cases tc
LEFT JOIN test_results tr ON tc.id = tr.test_case_id
WHERE tc.test_suite_id = ? -- Cambiar por ID de suite
ORDER BY tc.created_at ASC;
