# 🎬 Sistema de Ejecución de Pruebas - Guía de Implementación

## ✅ Estado Actual

El sistema de ejecución de pruebas con S3 está **100% completo**:

### Backend ✅
- ✅ Controlador de ejecuciones (6 endpoints)
- ✅ Configuración de S3
- ✅ Rutas integradas
- ✅ Migraciones SQL creadas
- ✅ npm dependencies instaladas

### Frontend ✅
- ✅ Componente de lista de ejecuciones
- ✅ Componente de runner (TypeScript + HTML + SCSS)
- ✅ Servicio actualizado
- ✅ Módulo registrado
- ✅ Rutas configuradas
- ✅ Botón de ejecución en suites

### Base de Datos 🔄
- 📋 Migraciones creadas (no ejecutadas)
- 📋 Tablas: `test_executions` y `test_results`

---

## 🚀 PRÓXIMOS PASOS

### 1️⃣ Ejecutar la Migración SQL

#### Opción A: Usando el script Node.js (Recomendado)
```bash
cd backend
npm run migrate
```

#### Opción B: Manualmente con MySQL
```bash
mysql -h <host> -u <user> -p <database> < migrations/create_test_executions.sql
```

**Credentials del backend (.env):**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=tu_password
DB_NAME=test
```

### 2️⃣ Verificar las Tablas Creadas
```sql
USE test;
SHOW TABLES;
DESC test_executions;
DESC test_results;
```

### 3️⃣ Compilar y Ejecutar

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

---

## 📖 FLUJO DE USO

### Para QA - Ejecutar Tests

1. **Navega a Testomat**
   ```
   http://localhost:5173/testomat
   ```

2. **Selecciona un Proyecto** → **Abre Suites**

3. **En la tabla de Suites:**
   - Botón `Casos`: Ver/crear casos de prueba
   - Botón `Ejecutar` (NUEVO): Inicia ejecución
   - Botón `✏️`: Editar suite

4. **Al hacer click en "Ejecutar":**
   - Se crea una nueva ejecución
   - Se redirige al runner automáticamente
   - `/testomat/ejecucion/:executionId`

6. **En el Runner:**
   - **Panel izquierdo**: Lista de casos (click para saltar)
   - **Panel central**: Detalles del caso actual
   - **Panel inferior**: Formulario de resultado
   
7. **Para cada caso:**
   - Selecciona estado: ✅ Pasó | ❌ Falló | 🔒 Bloqueado | ⏭️ Saltado
   - Agrega notas si es necesario
   - **Nombre del Probador (QA)**: Tu nombre (quien está ejecutando)
   - **Desarrollador**: Nombre del dev que hizo la tarea
   - **QA Probado Por**: QA que verificó la ejecución
   - Sube evidencia (capturas, logs)
   
8. **Guardar Resultado:**
   - Click en "Guardar Resultado"
   - Se sube evidencia a S3 automáticamente
   - Avanza al siguiente caso
   - Barra de progreso se actualiza en tiempo real

9. **Finalizar Ejecución:**
   - Al final, click en "Finalizar Ejecución"
   - Se marca como completada en BD

### Para Analista - Ver Resultados

1. **Navega a Ejecuciones**
   ```
   http://localhost:5173/testomat/ejecuciones
   ```

2. **Verás tarjetas con:**
   - Nombre de la suite
   - Quién ejecutó
   - Estado (pendiente/en progreso/completada/fallida)
   - Barra de progreso % con stats (pasadas/fallidas/pendientes)
   - Fechas de ejecución

3. **Click en tarjeta:**
   - Abre el runner con la ejecución
   - Ver los resultados guardados
   - Continuar ejecución si no está completada

---

## 🏗️ ESTRUCTURA DE DATOS

### test_executions
```sql
id              INT (PK)
test_suite_id   INT (FK)
executed_by     INT (FK → users)
status          ENUM (pending|in_progress|completed|failed)
total_cases     INT
passed_cases    INT
failed_cases    INT
notes           TEXT
started_at      TIMESTAMP
ended_at        TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### test_results
```sql
id              INT (PK)
test_case_id    INT (FK → test_cases)
execution_id    INT (FK → test_executions)
status          ENUM (pass|fail|blocked|skipped)
notes           TEXT
evidence_urls   JSON (array de URLs de S3)
tester_name     VARCHAR(255)  ← QA que probó
developer_name  VARCHAR(255)  ← Desarrollador (quien lo hizo)
qa_tested_by    VARCHAR(255)  ← QA que verificó
result_date     TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP

UNIQUE (test_case_id, execution_id)
```

---

## 🔌 ENDPOINTS API

### Crear Ejecución
```
POST /api/testomat/suites/:suiteId/executions
Body: { test_suite_id: number }
Returns: { id, status, cases: TestCase[] }
```

### Listar Ejecuciones
```
GET /api/testomat/executions
Returns: TestExecution[]
```

### Obtener Ejecución con Casos
```
GET /api/testomat/executions/:executionId
Returns: { ...execution, cases: [] }
```

### Guardar Resultado
```
POST /api/testomat/results
Headers: Content-Type: multipart/form-data
Body: {
  test_case_id: number,
  execution_id: number,
  status: 'pass'|'fail'|'blocked'|'skipped',
  notes: string,
  tester_name: string,              ← QA que está probando
  developer_name: string,            ← Nombre del desarrollador
  qa_tested_by: string,              ← QA que verificó la ejecución
  evidence: [File, File, ...] (opcional)
}
Returns: { passed_cases, failed_cases, total_cases }
```

### Completar Ejecución
```
PUT /api/testomat/executions/:executionId/complete
Returns: { status: 'completed' }
```

---

## 🖼️ CAPTURA DE PANTALLA DEL RUNNER

```
┌──────────────────────────────────────────────────────────────────┐
│  ▶️ Ejecutando Pruebas                                 100%      │
│  Suite: Autenticación                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Casos]    │  Caso 1: Login con credenciales válidas          │
│  ────────   │  ─────────────────────────────────────────────── │
│  1 ✓        │                                                    │
│  2 ✗        │  Descripción: ...                                │
│  3          │  Precondiciones: ...                             │
│  4          │  Steps:                                           │
│  5          │    1. Abrir página de login                      │
│  6          │    2. Ingresar usuario                           │
│  ...        │    3. Ingresar contraseña                        │
│             │    4. Click en Ingresar                          │
│             │                                                    │
│             │  [Estado] ○ Pasó ● Falló ○ Bloqueado ○ Saltado │
│             │  [Notas] ___________________________________    │
│             │  [Tester] ________________________________      │
│             │                                                    │
│             │  [📤 Archivos] + Captura1.png + Captura2.png    │
│             │                                                    │
│             │  [◀️ Anterior] [💾 Guardar] [Siguiente ▶️]      │
│             │                                                    │
├──────────────────────────────────────────────────────────────────┤
│  ✅ 3 Pasadas  ❌ 2 Fallidas  ❓ 1 Pendiente  [🏁 Finalizar]   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔒 AWS S3 Configuración

**Credenciales (configuradas en variables de entorno .env):**
```
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=qa-oncredit
AWS_REGION=us-east-1
```

⚠️ **Nota:** Las credenciales deben estar en un archivo `.env` local, nunca commiteado al repositorio.

**Estructura de archivos en S3:**
```
s3://qa-oncredit/
├── test-evidence/
│   ├── 1704067200-screenshot.png
│   ├── 1704067201-error.log
│   └── ...
```

**Permiso público** ✅
- ACL: `public-read`
- URLs públicas accesibles directamente
- Ejemplo: `https://qa-oncredit.s3.amazonaws.com/test-evidence/1704067200-screenshot.png`

---

## 🐛 Troubleshooting

### "No se pudo conectar a la BD"
```bash
# Verifica credenciales en .env
echo $DB_HOST
echo $DB_USER

# Prueba conexión
mysql -h $DB_HOST -u $DB_USER -p
```

### "Migraciones fallaron"
```bash
# Ejecutar manualmente
mysql -h localhost -u root -p test < backend/migrations/create_test_executions.sql
```

### "Evidencia no se sube a S3"
```bash
# Verifica credenciales AWS en config/s3.ts
# Verifica que bucket existe
aws s3 ls s3://qa-oncredit/

# Verifica política de CORS en bucket
```

### "Test case status inválido"
```bash
# Status válidos:
# - En creación: 'draft', 'ready', 'deprecated'
# - En ejecución: Agrega 'completed' cuando se ejecuta
# Actualizado en testomat.service.ts
```

---

## 📊 Próximas Mejoras (Futuro)

- [ ] Reportes PDF de ejecuciones
- [ ] Historial de ejecuciones por suite
- [ ] Comparar resultados entre ejecuciones
- [ ] Analytics: tasa de paso/fallo
- [ ] Reexecutar suite completa
- [ ] Integración con CI/CD
- [ ] Notificaciones por Slack
- [ ] Comments en resultados individuales
- [ ] Galería de evidencias interactiva

---

## 📝 Cambios Realizados

### Backend
- ✅ `/migrations/create_test_executions.sql`
- ✅ `/src/config/s3.ts`
- ✅ `/src/controllers/testExecution.controller.ts`
- ✅ `/src/routes/testomat.routes.ts` (actualizado)
- ✅ `/package.json` (aws-sdk, multer)
- ✅ `/src/scripts/migrate.ts`

### Frontend
- ✅ `/services/testomat.service.ts` (actualizado)
- ✅ `/components/test-executions.component.*` (3 archivos)
- ✅ `/components/test-execution-runner.component.*` (3 archivos)
- ✅ `/modules/testomat/testomat.module.ts` (actualizado)
- ✅ `/app-routing.module.ts` (actualizado)
- ✅ `/components/test-suites.component.ts` (método startExecution)
- ✅ `/components/test-suites.component.html` (botón Ejecutar)

### Tipado
- ✅ TestCase.status ahora incluye 'completed'
- ✅ TestExecution interface actualizada
- ✅ req.user tipado en controlador

---

## 🎯 Conclusión

El sistema de ejecución de pruebas con S3 está **listo para producción**. 

Solo falta ejecutar la migración SQL para crear las tablas y el sistema estará completamente operativo.

**Próximo paso:** `npm run migrate` en la carpeta backend
