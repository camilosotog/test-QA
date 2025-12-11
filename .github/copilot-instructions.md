# Manager QA - Instrucciones para Agentes de IA

## Descripción General
**Manager QA** es una aplicación web fullstack para ejecutar, monitorear y reportear pruebas de software (Postman/Newman, Playwright, TestOmat). Gestiona proyectos, casos de prueba, ejecuciones y evidencias con visualización en tiempo real.

**Stack**: Angular 17 (frontend) → Node.js/Express (backend) → MySQL + S3 (datos/archivos)

---

## Arquitectura de Alto Nivel

### Estructura Monorepo
```
Manager/
├── frontend/           # Angular 17 SPA (puerto 4200)
│   └── src/app/modules/testomat/    # Gestor de casos de prueba (reemplaza TestOmat.io)
├── backend/            # Node.js/Express API (puerto 4000)
│   ├── src/routes/     # 11 módulos: auth, testomat, postman, playwright, bugs, etc.
│   └── migrations/     # Schema MySQL auto-ejecutado al iniciar
└── Documentación: 40+ archivos en MD con arquitectura, flujos e implementaciones
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

# Frontend (terminal 2)
cd frontend
npm install
npm start                # Sirve en 4200, proxy a localhost:4000
# O para acceso externo (requerido para Ngrok):
npm start -- --host 0.0.0.0 --disable-host-check
```

### Ngrok (Acceso Público)
```powershell
# Expone frontend en URL pública para pruebas en dispositivos
# Comando ya en package.json:
npm run ngrok            # Usa URL estática: https://flying-pleasing-stag.ngrok-free.app
```

### Build/Deploy
```powershell
# Backend
npm run build            # Compila TS → JS en `dist/`
npm start                # Corre dist/server.js en producción

# Frontend
npm run build            # Genera `dist/frontend/` optimizado
```

---

## Puntos de Integración Críticos

### Module Testomat (Gestor de Casos de Prueba)
- **Ubicación:** `frontend/src/app/modules/testomat/`
- **Ruta:** `/testomat/*`
- **Endpoints backend:** `/api/testomat` (GET projects, POST suites, GET cases, POST results, etc.)
- **Responsabilidad:** CRUD completo de proyectos → suites → casos → ejecuciones → resultados
- **Base de datos:** Reemplaza TestOmat.io; todo está en BD local (`test_projects`, `test_cases`, `test_executions`, `test_results`)

### Postman/Newman Integration
- **Controllers:** `backend/postman.controller.ts`
- **Rutas:** `/api/postman/{contract|controlled-response|response}-results`
- **Flujo:** Lee JSON de colección Postman en `backend/src/files/yamahaAPI.json` → ejecuta con Newman → parsea resultados → guarda en BD con assertions/response bodies
- **Datos:** Tabla `test_results` contiene `response_body` (JSON) + lista de evidencias URL

### Playwright Integration
- **Controllers:** `backend/playwright.controller.ts`
- **Rutas:** `/api/playwright/{summary|daily|top-failures|results|contract-results|...}`
- **Modelos:** Dinámicos por proyecto (`playwright_results_[projectName]`)
- **Patrón:** Controllers filtran por `projectName` en request body para análisis multi-proyecto

### Bugs & Tracking
- **Módulo:** `backend/bugs.controller.ts`
- **DB:** Tabla `bugs` con `project_id`, `status`, `severity`, `description`
- **Flujo:** Usuarios reportan bugs → listados en `/bugs` con filtros → asignables a usuarios

### Dibujo Colaborativo (Nuevo)
- **Backend:** `backend/drawing.controller.ts` + Socket.io events en `server.ts`
- **Frontend:** `pages/dibujo-colaborativo/` componente con Canvas HTML5
- **Funcionalidades:** Dibujo en tiempo real, múltiples usuarios, colores/grosores, limpiar canvas, descarga
- **Socket events:** `drawing`, `drawing-cleared`, `user-joined`, `user-left`
- **Ruta:** `/dibujo-colaborativo` (disponible para todos los usuarios autenticados)

---

## Decisiones de Diseño Importante

### 1. PDF Export: Base64 Conversion (No URLs Directas)
**Por qué:** pdfMake no soporta URLs directas en navegadores por CORS. 
**Solución:** `urlToBase64()` convierte imágenes S3 a DataURL antes de insertarlas.
**Fallback:** Si conversion falla, inserta URL como texto clickeable.

### 2. Evidencias como Arrays JSON
**Por qué:** Permite acumular múltiples evidencias sin sobrescribir.
**Patrón:**
```typescript
// BD: JSON.stringify([url1, url2, url3...])
// Frontend: JSON.parse() → *ngFor para mostrar
// Agregar evidencia: combine array anterior + URLs nuevas → stringify de nuevo
```

### 3. Ngrok + CORS Abierto
**Por qué:** Necesario para pruebas en dispositivos reales, ngrok asigna URLs dinámicas.
**Configuración:** CORS permite `*.ngrok-free.app` regex + localhost, `ngrok-skip-browser-warning` header.

### 4. Socket.io Implementación Activa
**Estado:** Totalmente implementado para dibujo colaborativo en tiempo real.
**Uso actual:** Sistema de dibujo colaborativo con eventos: `drawing`, `drawing-cleared`, `user-joined`, `user-left`.
**Patrón:** Cada trazo se almacena en memoria del backend y se retransmite a todos los usuarios conectados.

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

- **TS/JS:** Async/await (no callbacks), tipos explícitos, camelCase
- **Nombres:** Controllers `[feature].controller.ts`, Routes `[feature].routes.ts`, Services `[feature].service.ts`
- **Errores:** Siempre incluir `message` en respuestas, logs con contexto (qué operación, qué data)
- **Git:** Branches por feature (`feature/pdf-export`), PRs con descripción, commits atómicos
- **Documentación:** Cada cambio mayor → .md file con "Cambios", "Arquitectura", "Testing" sections

---

## Ficheros Clave para Referenciar

| Ruta | Propósito |
|------|-----------|
| `frontend/src/app/modules/testomat/components/test-execution-runner.component.ts` | PDF export, evidencias, UI test cases |
| `backend/src/app.ts` | Configuración Express, rutas, CORS |
| `backend/src/server.ts` | Punto entrada, Socket.io, migraciones |
| `backend/src/routes/testomat.routes.ts` | Endpoints CRUD projects/suites/cases/executions |
| `backend/src/controllers/testomat.controller.ts` | Lógica negocio, S3 upload, BD queries |
| `backend/migrations/*.sql` | Schema MySQL (autoreferencia para queries) |
| `frontend/src/app/modules/testomat/services/testomat.service.ts` | Wrapper HTTP, transformaciones |
| `frontend/src/app/core/auth.interceptor.ts` | JWT injection en headers |

---

## Próximos Desarrollos (Roadmap)

- Implementar Socket.io listeners para notificaciones en tiempo real
- Integración con TestOmat.io API para importación/exportación
- Reportes avanzados (gráficas de tendencia, burndown)
- Integración con CI/CD (Jenkins, GitHub Actions)
- Sistema de permisos granular (roles por proyecto)

---

**Última actualización:** 23 de noviembre de 2025  
**Contacto:** Equipo QA

## Módulo de Dibujo Colaborativo (Nuevo)

### Funcionalidades Implementadas
- **Canvas HTML5** con herramientas de dibujo (colores, grosores, borrador)
- **Tiempo real** via Socket.io - todos los usuarios ven trazos instantáneamente  
- **Persistencia en memoria** - dibujos se mantienen durante la sesión del servidor
- **Multi-usuario** - lista de usuarios conectados en tiempo real
- **Descarga** - exportar canvas como imagen PNG
- **Responsive** - funciona en desktop y móvil (touch events)

### Archivos Clave
- `backend/src/controllers/drawing.controller.ts` - API REST + lógica de estado
- `backend/src/routes/drawing.routes.ts` - Endpoints `/api/drawing/data` y `/clear`
- `frontend/src/app/core/drawing.service.ts` - Socket.io client + manejo de estado
- `frontend/src/app/pages/dibujo-colaborativo/` - Componente Angular completo
- `backend/src/server.ts` - Eventos Socket.io: drawing, drawing-cleared, user-joined, user-left
