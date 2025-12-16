# Manager QA - Instrucciones para Agentes de IA

## Descripción General
**Manager QA** es una aplicación web fullstack para ejecutar, monitorear y reportear pruebas de software (Postman/Newman, Playwright, TestOmat). Gestiona proyectos, casos de prueba, ejecuciones y evidencias con visualización en tiempo real.

**Stack**: Angular 17 (frontend, puerto 4200) → Node.js/Express (backend, puerto 4000) → MySQL + AWS S3 (datos/archivos)

**Repo**: GitHub (camilosotog/test-QA, rama `manager`)  
**Última actualización**: 16 de diciembre de 2025

---

## Arquitectura de Alto Nivel

### Estructura Monorepo
```
Manager/
├── frontend/           # Angular 17 SPA (puerto 4200)
│   ├── src/app/modules/testomat/    # Gestor de casos de prueba (reemplaza TestOmat.io)
│   ├── src/app/pages/               # Páginas: automated-tasks, bugs, estadísticas, 
│   │                                  returns, dibujo-colaborativo, requirement-returns
│   ├── src/app/core/                # Guards, interceptors, servicios core
│   └── src/app/shared/              # Componentes reutilizables
├── backend/            # Node.js/Express API (puerto 4000)
│   ├── src/routes/     # 14 módulos: auth, testomat, postman, playwright, bugs, 
│   │                     drawing, return, requirementReturn, boards, items, etc.
│   ├── src/controllers/              # Lógica de negocio por módulo
│   ├── src/middlewares/              # auth, manejo de errores
│   ├── src/utils/                    # migrations, DB queries, utilidades
│   └── migrations/     # Schema MySQL auto-ejecutado al iniciar
└── Documentación: 70+ archivos en MD con arquitectura, flujos, guías de uso
```

### Flujo de Datos Crítico
1. **Frontend** (Angular) → HttpClient → Proxy local (`proxy.conf.json`) 
2. **Proxy** redirige `/api/*` → `localhost:4000` (backend)
3. **Backend** (Express) procesa, interactúa con MySQL/S3, devuelve JSON
4. **Socket.io** para notificaciones en tiempo real (ejecuciones finalizadas, etc.)
5. **S3 AWS** almacena evidencias (imágenes, videos) con URLs públicas

---

## Patrones y Convenciones Específicos

### Backend (Node.js/Express)

**Estructura estándar de un controlador:**
```typescript
// backend/src/controllers/[feature].controller.ts
export const methodName = async (req: Request, res: Response) => {
  const { projectId, executionId } = req.params;
  const { data } = req.body;
  
  try {
    // Lógica: query DB, procesa, sube a S3
    const result = await connection.query('SELECT * FROM table WHERE id = ?', [id]);
    
    // Responde con status + mensaje (siempre incluir 'message')
    res.json({ success: true, data: result, message: 'Operación exitosa' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Rutas protegidas:** Todas usan middleware `auth` que valida JWT del header `Authorization`.

**Manejo S3:** Usa `aws-sdk`, carga archivos de Multer con nombre único + timestamp, devuelve URL pública: `https://qa-oncredit.s3.amazonaws.com/[filename]`

**Base de datos:** MySQL con migraciones auto-ejecutadas (archivos `.sql` en `migrations/`). Schema incluye: usuarios, proyectos, suites, casos, ejecuciones, resultados, evidencias (como JSON arrays de URLs).

### Frontend (Angular 17)

**Patrón de componentes:**
- Smart component (container) en `pages/` - gestiona lógica, llamadas HTTP, estado
- Dumb components (presentational) en `components/` - solo UI, reciben @Input, emiten @Output
- Servicios inyectables (`services/`) wrappean llamadas HTTP con método `.pipe()`

**Evidencias en tests:** Guardadas como `JSON.stringify([urls...])` en BD → parseadas en frontend → iteradas con `*ngFor` para mostrar.

**PDF Export específico:** 
- `test-execution-runner.component.ts` has custom `exportToPDF()` function
- **Patrón crítico**: URLs de imágenes (S3) requieren conversión a **base64 DataURL** antes de pasar a pdfMake
- Función `urlToBase64()` usa `fetch()` + `Canvas` API para convertir
- Fallback a URL pública si base64 falla (videos se mantienen como enlaces HTTP clickeables)

**Estilos:** Bootstrap 5 + SCSS custom. Selectores de estado usan `:has()` para colorear contenedor según radio button seleccionado (ej: `&:has(#status_pass:checked) { background: green; }`).

---

## Comandos Principales

### Desarrollo Local
```powershell
# Backend (terminal 1)
cd backend
npm install
npm run dev              # Nodemon con ts-node, escucha puerto 4000
npm run dev:debug        # Debug en puerto 9229 para VSCode/Chrome DevTools

# Frontend (terminal 2)
cd frontend
npm install
npm start                # Sirve en 4200, proxy a localhost:4000
npm start-dev            # Alias para npm start con proxy en desarrollo

# Para acceso externo (requerido para testing en dispositivos reales):
npm start -- --host 0.0.0.0 --disable-host-check
```

### Ngrok (Acceso Público)
```powershell
# Expone frontend en URL pública para pruebas en dispositivos
npm run ngrok            # Usa URL estática: https://flying-pleasing-stag.ngrok-free.app
```

### Build/Deploy
```powershell
# Backend
npm run build            # Compila TS → JS en `dist/`
npm start                # Corre dist/server.js en producción

# Frontend
npm run build            # Genera `dist/frontend/` optimizado
npm run watch            # Build en modo watch para desarrollo
```

---

## Puntos de Integración Críticos

### Module Testomat (Gestor de Casos de Prueba - Principal)
- **Ubicación:** `frontend/src/app/modules/testomat/`
- **Ruta:** `/testomat/*` (projects, suites, cases, executions, results)
- **Endpoints backend:** `/api/testomat` (GET projects, POST suites, GET cases, POST results, etc.)
- **Responsabilidad:** CRUD completo de proyectos → suites → casos → ejecuciones → resultados
- **Base de datos:** Reemplaza TestOmat.io; todo en BD local (`test_projects`, `test_suites`, `test_cases`, `test_executions`, `test_results`)
- **Flujo crítico:** Seleccionar proyecto → crear ejecución → llenar estados + evidencias → exportar PDF con base64 de imágenes

### Postman/Newman Integration
- **Ubicación backend:** `backend/src/controllers/postman.controller.ts` + `backend/src/routes/postman.routes.ts`
- **Rutas:** `/api/postman/{contract|controlled-response|response}-results`
- **Flujo:** Lee JSON de colección Postman en `backend/src/files/yamahaAPI.json` → ejecuta con Newman → parsea resultados → guarda en BD
- **Datos:** Tabla `test_results` contiene `response_body` (JSON) + lista de evidencias URL en S3

### Playwright Integration (Análisis Multi-Proyecto)
- **Ubicación:** `backend/src/controllers/playwright.controller.ts` + `backend/src/routes/playwright.routes.ts`
- **Rutas:** `/api/playwright/{summary|daily|top-failures|results|contract-results|...}`
- **Modelos:** Dinámicos por proyecto (`playwright_results_[projectName]`)
- **Patrón:** Controllers filtran por `projectName` en request body para análisis multi-proyecto
- **Dashboards:** Gráficas de tendencias, top failures, estadísticas diarias

### Returns Module (Devoluciones)
- **Ubicación frontend:** `frontend/src/app/pages/returns/`
- **Endpoints:** `/api/return/*` y `/api/requirementReturn/*`
- **Responsabilidad:** Gestión de devoluciones y devoluciones por requerimiento con evidencias
- **Especial:** Flujo completo de devoluciones con archivos, notas, asignación y seguimiento

### Bugs & Tracking
- **Módulo:** `backend/src/controllers/bugs.controller.ts` + `backend/src/routes/bugs.routes.ts`
- **BD:** Tabla `bugs` con `project_id`, `status`, `severity`, `description`
- **Frontend:** `frontend/src/app/pages/bugs/` y `bug-detail/`
- **Flujo:** Usuarios reportan bugs → listados con filtros → asignables a usuarios → seguimiento de estado

### Dibujo Colaborativo (Socket.io Real-Time)
- **Backend:** `backend/src/controllers/drawing.controller.ts` + Socket.io en `server.ts`
- **Frontend:** `frontend/src/app/pages/dibujo-colaborativo/` componente con Canvas HTML5
- **Socket events:** `drawing`, `drawing-cleared`, `user-joined`, `user-left`
- **Funcionalidades:** Colores, grosores, borrador, limpiar, descarga PNG, responsive (touch)
- **Persistencia:** En memoria durante sesión del servidor

### Automated Tasks (Ejecuciones Automáticas)
- **Frontend:** `frontend/src/app/pages/automated-tasks/`
- **Backend:** `backend/src/routes/automatedTasks.routes.ts`
- **Propósito:** Programar y monitorear ejecuciones automáticas de tests

### Boards & Items (Kanban-like)
- **Rutas:** `/api/boards/*`, `/api/items/*`, `/api/qaItems/*`, `/api/sprints/*`
- **Propósito:** Organización de trabajo en sprints y seguimiento de ítems QA

### Users & Auth (Sistema de Usuarios)
- **Rutas:** `/api/auth/*`, `/api/users/*`
- **Autenticación:** JWT en header `Authorization`
- **Middleware:** `auth.middleware.ts` valida token en todas las rutas protegidas
- **Almacenamiento:** Usuarios con roles y permisos por proyecto

### Pictionary Game (Bonus Feature)
- **Socket.io game:** Completamente implementado en `server.ts`
- **Características:** Multi-jugador, turnos de dibujante, adivinanzas, sistema de puntos
- **Palabras:** 1000+ palabras en `src/gameWords-extended.ts`
- **Estado:** Juego activo con estados de ronda, timer, pistas gradualmente reveladas

---

## Decisiones de Diseño Importante

### 1. PDF Export: Base64 Conversion (No URLs Directas)
**Por qué:** pdfMake no soporta URLs directas en navegadores por CORS y restricciones de seguridad.
**Solución:** `urlToBase64()` en componente convertidor convierte imágenes S3 a DataURL antes de insertarlas en PDF.
**Implementación:** Usa `fetch()` + `Canvas API` para conversión en el cliente.
**Fallback:** Si conversion falla, inserta URL como texto clickeable; videos se mantienen como enlaces HTTP.
**Ubicación:** `frontend/src/app/modules/testomat/components/test-execution-runner.component.ts`

### 2. Evidencias como Arrays JSON
**Por qué:** Permite acumular múltiples evidencias sin sobrescribir durante múltiples ejecuciones.
**Patrón:**
```typescript
// BD: JSON.stringify([url1, url2, url3...])
// Frontend: JSON.parse() → *ngFor para mostrar
// Agregar: combine array anterior + URLs nuevas → stringify de nuevo
```
**Almacenamiento:** Campo `evidence` en tablas de resultados como JSON serializado.

### 3. Ngrok + CORS Abierto
**Por qué:** Necesario para pruebas en dispositivos reales; ngrok asigna URLs dinámicas.
**Configuración en `backend/src/app.ts`:** CORS permite:
- `localhost:4200`, `localhost:4000`
- `https://flying-pleasing-stag.ngrok-free.app` (URL estática)
- Regex `/\.ngrok-free\.app$/` y `/\.ngrok\.io$/` (cualquier subdominio)
- Header especial: `ngrok-skip-browser-warning`

### 4. Socket.io Arquitectura Multi-Feature
**Estado:** Completamente implementado en `server.ts` con múltiples canales independientes.
**Canales activos:**
- **Dibujo Colaborativo:** `drawing`, `drawing-cleared`, `user-joined`, `user-left`
- **Chat:** Mensajes en tiempo real (almacenado en memoria, mejora futura: BD)
- **Pictionary Game:** Estados completos del juego, turnos, puntos, adivinanzas
- **Notificaciones:** Ejecuciones finalizadas, cambios de estado

**Patrón:** Cada trazo/evento se retransmite a todos los usuarios conectados.
**CORS Socket.io:** Abierto a cualquier origen (`origin: '*'`).

### 5. Migraciones Auto-Ejecutadas
**Por qué:** Garantiza consistencia de esquema sin steps manuales.
**Implementación:** `runMigrations()` en `server.ts` lee `/migrations/*.sql` al iniciar.
**Idempotencia:** Scripts usan `IF NOT EXISTS` para evitar errores.
**Developer Experience:** Nuevo dev = `npm install && npm run dev` → DB lista automáticamente.

### 6. Proxy Local en Desarrollo
**Frontend proxy.conf.json:** Redirige `/api/*` → `localhost:4000`.
**Ventaja:** Evita CORS en desarrollo, simula ambiente real de producción.
**Configuración:** Script `npm start` incluye `--proxy-config proxy.conf.json` automáticamente.

---

## Flujos Importantes para Entender

### Crear y Ejecutar Test Case
1. Usuario navega a `/testomat/proyectos`
2. Selecciona proyecto → crea suite → agrega casos
3. Crea ejecución → aparece en `/testomat/ejecuciones`
4. Abre ejecución → lista de casos con dropdowns (estado, QA, evidencias)
5. Selecciona estado + evidencias + anotaciones
6. Click "Guardar resultado" → POST `/api/testomat/results` → sube a S3 + guarda URLs en BD
7. Acceso a `/testomat/ejecucion/:id` para revisar/exportar a PDF

### Base de Datos Auto-Migrada
- Al iniciar backend, `runMigrations()` ejecuta todos `.sql` en `migrations/`
- Crea tablas si no existen (idempotente)
- Nuevo desarrollador: solo `npm install && npm run dev` — DB se setupea automáticamente

---

## Errores Comunes y Soluciones

| Error | Causa | Fix |
|-------|-------|-----|
| "Invalid image: File 'https://...' not found in virtual file system" | URL directa en pdfMake | Usar `urlToBase64()` para DataURL |
| 404 en `/api/testomat/...` | Ruta no registrada en backend | Verificar `backend/src/app.ts` + ruta en `testomat.routes.ts` |
| CORS bloqueado | Frontend no es origen permitido | Agregar origen a CORS array en `backend/src/app.ts` |
| Imágenes no cargan en PDF | Falla en conversión base64 | Checkear permisos S3, usar fallback URL texto |
| DB tables no existen | Migraciones no ejecutadas | Verificar carpeta `migrations/` tiene `.sql`, checar logs de error |

---

## Convenciones de Código

- **TS/JS:** Async/await (no callbacks), tipos explícitos, camelCase para variables/funciones
- **Nombres de archivos:** Controllers `[feature].controller.ts`, Routes `[feature].routes.ts`, Services `[feature].service.ts`
- **Respuestas API:** SIEMPRE incluir objeto con `{ success: boolean, data?: T, message: string, error?: string }`
- **Errores:** Status HTTP apropiados (400 validación, 401 auth, 403 forbidden, 404 not found, 500 server error)
- **Logs:** Context detallado - qué operación, parámetros de entrada, resultado
- **BD Queries:** Usar connection pool de mysql2, placeholders `?` para evitar SQL injection
- **Autenticación:** JWT en header `Authorization: Bearer <token>`, middleware `authMiddleware` en todas rutas protegidas
- **CORS:** Configurado en `app.ts` con lista blanca de orígenes (localhost, ngrok)
- **S3 Upload:** Multer para archivos, generar filename único + timestamp, devolver URL pública
- **Git:** Branches por feature (`feature/nombre`), PRs con descripción, commits atómicos descriptivos
- **Documentación:** Major features → .md file con secciones: "Descripción", "Flujo", "Testing", "API Endpoints"

---

## Ficheros Clave para Referenciar

| Ruta | Propósito |
|------|-----------|
| `frontend/src/app/modules/testomat/components/test-execution-runner.component.ts` | PDF export con base64, manejo evidencias, UI casos prueba |
| `frontend/src/app/modules/testomat/services/testomat.service.ts` | HTTP wrapper, transformaciones datos testomat |
| `backend/src/app.ts` | Configuración Express, imports rutas, CORS whitelist |
| `backend/src/server.ts` | Entry point, Socket.io listeners, migraciones, Pictionary game |
| `backend/src/routes/testomat.routes.ts` | Endpoints CRUD proyectos/suites/casos/ejecuciones |
| `backend/src/controllers/testomat.controller.ts` | Lógica negocio testomat, S3 upload, queries BD |
| `backend/src/controllers/drawing.controller.ts` | API dibujo colaborativo, manejo estado canvas |
| `backend/src/routes/drawing.routes.ts` | Endpoints `/api/drawing/data`, `/clear` |
| `backend/src/controllers/postman.controller.ts` | Ejecución Newman, parseo resultados Postman |
| `backend/src/controllers/playwright.controller.ts` | Análisis multi-proyecto, dashboards tendencias |
| `backend/src/middlewares/auth.middleware.ts` | Validación JWT, inyección usuario en request |
| `backend/migrations/*.sql` | Schema MySQL (referencia para queries, `IF NOT EXISTS` required) |
| `backend/src/gameWords-extended.ts` | 1000+ palabras para Pictionary game |
| `frontend/src/app/core/auth.interceptor.ts` | JWT injection automático en headers |
| `frontend/proxy.conf.json` | Redirección `/api/*` → localhost:4000 |

---

## Próximos Desarrollos (Roadmap)

- Integración con TestOmat.io API para importación/exportación
- Reportes avanzados (gráficas de tendencia, burndown)
- Integración con CI/CD (Jenkins, GitHub Actions)
- Sistema de permisos granular (roles por proyecto)
- Persistencia Socket.io en BD (chat, Pictionary history)
- Métricas de calidad en tiempo real

---

**Última actualización:** 16 de diciembre de 2025  
**Rama actual:** manager  
**Contacto:** Equipo QA
