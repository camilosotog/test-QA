# Migración: Agregar Response Body a Postman Results

## Descripción
Esta migración agrega la columna `response_body` a la tabla `postman_results` para almacenar el cuerpo de la respuesta HTTP de cada petición Postman.

## Fecha
10 de noviembre de 2025

## Cambios en Base de Datos

### Tabla afectada
- `postman_results`

### Columna agregada
- `response_body` (TEXT, NULL)

## Cómo aplicar la migración

### Opción 1: Ejecución manual en MySQL
```sql
-- Conectarse a la base de datos
USE tu_base_de_datos;

-- Ejecutar la migración
ALTER TABLE postman_results 
ADD COLUMN IF NOT EXISTS response_body TEXT NULL AFTER response_time;
```

### Opción 2: Usando el archivo de migración
```bash
# Desde el directorio backend
mysql -u tu_usuario -p tu_base_de_datos < migrations/add_response_body_to_postman_results.sql
```

## Verificación
Para verificar que la columna se agregó correctamente:
```sql
DESCRIBE postman_results;
```

Deberías ver la columna `response_body` con tipo TEXT.

## Impacto
- **Frontend**: Ahora muestra la columna "Response Body" en la tabla de resultados de pruebas
- **Backend**: Los endpoints `/api/postman/contract-results`, `/api/postman/controlled-response-results` y `/api/postman/response-results` ahora incluyen el campo `response_body`
- **Compatibilidad**: La columna es NULL por defecto, por lo que es compatible con datos existentes

## Archivos modificados

### Backend
- `backend/src/controllers/postman.controller.ts`
  - Actualizada función `ensurePostmanTable()` para incluir columna en CREATE TABLE
  - Actualizada función `getContractTestResults()` para incluir response_body en SELECT
  - Actualizada función `getControlledResponseTestResults()` para incluir response_body en SELECT
  - Actualizada función `getResponseTestResults()` para incluir response_body en SELECT

### Frontend
- `frontend/src/app/core/postman.service.ts`
  - Agregado campo `response_body?: string | null` a interface `PostmanResult`
  
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.html`
  - Agregada columna "Response Body" en tabla de resultados Postman
  - Muestra primeros 200 caracteres del response body
  - Formato monospace para mejor legibilidad

## Notas
- Los registros antiguos (sin response_body) mostrarán "N/A" en la interfaz
- El response_body se trunca a 200 caracteres en la UI para mantener la tabla legible
- Se recomienda ejecutar la migración durante un periodo de bajo tráfico
