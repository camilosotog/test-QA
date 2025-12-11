# 🔍 Diagnóstico: Evidencias que se Sobrescriben

## Problema Reportado
Las evidencias se sobrescriben cuando se intenta subir varias. Solo queda la última evidencia.

## Cambios Realizados

### 1. **Backend - testExecution.controller.ts**
✅ Modifi cación: `saveTestResult()` ahora acumula evidencias
- Obtiene las evidencias existentes de `test_results.evidence_urls`
- Combina con las nuevas: `[...existingUrls, ...evidence_urls]`
- Guarda el array completo en JSON

### 2. **Frontend - test-execution-runner.component.ts**
✅ Modificación: `saveResult()` recarga la ejecución después de guardar
- Llamada a `getTestExecutionById()` para traer datos actualizados
- Actualiza el array `cases` con nuevas evidencias

✅ Modificación: `loadCaseResult()` 
- Limpia `evidenceFiles` al cambiar de caso
- Carga las evidencias guardadas del caso actual

✅ Agregado: Más logging en console para diagnosticar
- `loadCaseResult()` muestra qué evidencias tiene el caso
- `getSavedEvidenceUrls()` muestra qué retorna
- `saveResult()` muestra cuando se guardó

### 3. **Frontend - testomat.service.ts**
✅ Modificación: `saveTestResult()` envía todos los campos
- Ahora envía: `developer_name`, `qa_tested_by`
- Anteriormente solo enviaba: `tester_name`

## Cómo Diagnosticar

### Paso 1: Abrir la consola del navegador
```
F12 → Console tab
```

### Paso 2: Ejecutar una prueba
1. Abre una ejecución
2. Selecciona un caso
3. Carga: `screenshot1.png`
4. Guardar resultado
5. **Observa los logs en consola:**

```
📂 Cargando caso: [Nombre] ID: [ID]
📎 Evidence URLs: null (o array si hay previas)
✅ Result ID: null (primera vez) o [número] (actualización)
📸 Archivos seleccionados: 1
✅ Resultado guardado: {...}
🔍 getSavedEvidenceUrls() retornando: [URL]
```

### Paso 3: Cargar de nuevo el mismo caso
```
📂 Cargando caso: [Nombre] ID: [ID]
📎 Evidence URLs: [URL1] (debería mostrar la anterior)
🔍 getSavedEvidenceUrls() retornando: ["https://..."]
```

### Paso 4: Agregar más evidencias
1. Mantente en el mismo caso
2. Selecciona: `screenshot2.png`, `log.txt`
3. Guardar resultado
4. **Debería mostrar 3 evidencias en el UI**

## Verificación en Base de Datos

```sql
-- Ejecutar en MySQL Workbench
SELECT 
  tr.id,
  tr.test_case_id,
  tr.result_status,
  tr.evidence_urls,
  tr.created_at
FROM test_results tr
WHERE tr.evidence_urls IS NOT NULL
ORDER BY tr.created_at DESC
LIMIT 5;
```

### Qué esperar:
- **Correcto:** `["https://...", "https://...", "https://..."]`
- **Incorrecto:** `["https://..."]` (última solamente)
- **Nulo:** `null` (no se guardó nada)

## Logs Importantes

### En el backend (console)
```
💾 Saving result for case: 5 Status: pass
📋 Body: {test_case_id: 5, execution_id: 3, status: 'pass', ...}
📂 Files received: 1
📸 Evidence uploaded: ["https://s3-bucket.../file1.pdf"]
🔍 Existing result: 1 (hay resultado anterior)
📝 Existing evidence_urls: ["https://s3-bucket.../screenshot1.png"]
✅ Combined evidence URLs: 2 total
```

## Puntos de Fallo Comunes

1. **Multer no carga los archivos**
   - Síntoma: `Files received: 0`
   - Solución: Verificar que `Content-Type: multipart/form-data`

2. **JSON corrupto en BD**
   - Síntoma: Console error al parsear
   - Solución: Limpiar las URLs manualmente

3. **getTestExecutionById no retorna casos actualizados**
   - Síntoma: Evidencias guardadas no aparecen
   - Solución: Verificar que el JOIN en BD incluye `evidence_urls`

4. **getSavedEvidenceUrls() retorna vacío**
   - Síntoma: Sección "Evidencias guardadas" no aparece
   - Solución: Verificar que `currentCase.evidence_urls` está cargado

## Próximos Pasos

1. Ejecuta las pruebas y toma screenshots de los logs
2. Ejecuta el SQL de diagnóstico
3. Comparte:
   - Logs de consola del navegador
   - Resultado del SQL
   - Cantidad de evidencias que subiste vs. cuántas aparecen

