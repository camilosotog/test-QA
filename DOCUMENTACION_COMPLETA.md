# Documentación Completa - Manager QA

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
4. [Backend - API REST](#backend---api-rest)
5. [Frontend - Angular](#frontend---angular)
6. [Base de Datos](#base-de-datos)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Integraciones](#integraciones)
9. [Guía de Uso](#guía-de-uso)

---

## 📖 Descripción General

**Manager QA** es una aplicación web para la gestión y automatización de pruebas de software. Permite ejecutar, monitorear y analizar pruebas automatizadas de diferentes tipos (Postman, Playwright) con visualización de resultados en tiempo real.

### Propósito
- Centralizar la ejecución de pruebas automatizadas
- Visualizar métricas y estadísticas de calidad
- Gestionar múltiples proyectos de pruebas
- Generar reportes detallados de ejecuciones
- Proporcionar feedback en tiempo real sobre el estado de las pruebas

### Tecnologías Principales
- **Frontend**: Angular 17, TypeScript, Bootstrap 5, Chart.js
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: MySQL
- **Testing**: Newman (Postman), Playwright
- **Comunicación en tiempo real**: Socket.io
- **Túnel público**: Ngrok

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (Navegador)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Angular 17 Frontend (Puerto 4200)        │  │
│  │  - Componentes UI                                │  │
│  │  - Servicios HTTP                                │  │
│  │  - Socket.io Client                              │  │
│  │  - Chart.js para gráficas                        │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↕                                │
│              (HTTPS via Ngrok Proxy)                     │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Proxy de Angular (proxy.conf.json)          │
│  - Redirige /api/* → localhost:4000                     │
│  - Redirige /socket.io/* → localhost:4000               │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Backend Node.js (Puerto 4000)               │
│  ┌────────────────────────────────────────────────┐    │
│  │           Express REST API                      │    │
│  │  - Autenticación JWT                           │    │
│  │  - CORS configurado                            │    │
│  │  - Socket.io Server                            │    │
│  │  - Controladores de negocio                    │    │
│  └────────────────────────────────────────────────┘    │
│                         ↕                                │
│  ┌────────────────────────────────────────────────┐    │
│  │        Ejecutores de Pruebas                   │    │
│  │  - Newman (Postman Collections)                │    │
│  │  - Playwright (Browser Testing)                │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   MySQL Database                         │
│  - Usuarios y autenticación                             │
│  - Resultados de pruebas                                │
│  - Proyectos y configuraciones                          │
│  - Bugs y tareas automatizadas                          │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario accede** → Ngrok → Angular Frontend
2. **Petición API** → Proxy de Angular → Backend Express
3. **Ejecución de pruebas** → Newman/Playwright → Resultados
4. **Almacenamiento** → MySQL Database
5. **Notificaciones en tiempo real** → Socket.io → Frontend

---

## 🎯 Módulos y Funcionalidades

### 1. Módulo de Autenticación
**Propósito**: Gestionar el acceso seguro a la aplicación

**Funcionalidades**:
- Login con email y contraseña
- Autenticación basada en JWT (JSON Web Tokens)
- Gestión de sesiones
- Roles de usuario (admin, QA tester)
- Protección de rutas con guards

**Archivos clave**:
- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `frontend/src/app/core/auth.service.ts`
- `frontend/src/app/core/auth.guard.ts`

---

### 2. Módulo de Proyectos
**Propósito**: Organizar pruebas por proyectos empresariales

**Funcionalidades**:
- Visualización de proyectos disponibles
- Información de cada proyecto (nombre, descripción, suites de prueba)
- Estado del proyecto (activo, en mantenimiento)
- Selector visual con tarjetas elegantes

**Componentes**:
- Tarjeta de proyecto con ícono personalizado
- Badge de estado con animación
- Estadísticas (número de suites, última ejecución)
- Botón de acceso a pruebas

**Proyectos actuales**:
- **Yamaha**: Proyecto de preproducción Yamaha (11 suites de prueba)

**Archivos clave**:
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.ts`
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.html`

---

### 3. Módulo de Pruebas Postman
**Propósito**: Ejecutar y analizar pruebas de API usando colecciones de Postman

#### 3.1 Tipos de Pruebas Postman

##### A. Pruebas de Contrato
- **Descripción**: Validan que la API cumple con el contrato definido (estructura, tipos de datos, campos requeridos)
- **Endpoint**: `POST /api/postman/contract-results`
- **Casos de uso**: 
  - Verificar estructura de respuestas JSON
  - Validar tipos de datos
  - Comprobar presencia de campos obligatorios

##### B. Pruebas de Respuesta Controlada
- **Descripción**: Validan respuestas específicas en escenarios controlados
- **Endpoint**: `POST /api/postman/controlled-response-results`
- **Casos de uso**:
  - Verificar códigos de estado HTTP
  - Validar mensajes de error específicos
  - Comprobar comportamiento con datos predefinidos

##### C. Pruebas de Respuesta General
- **Descripción**: Validan el comportamiento general de la API
- **Endpoint**: `POST /api/postman/response-results`
- **Casos de uso**:
  - Pruebas end-to-end
  - Validación de flujos completos
  - Pruebas de integración

#### 3.2 Funcionalidades del Módulo Postman

**Ejecución de Pruebas**:
- Ejecutar colección completa de Postman
- Reintentos automáticos en caso de fallo
- Configuración de variables de entorno
- Timeouts personalizables

**Análisis de Resultados**:
- Métricas globales (total, aserciones, fallos, tasa de éxito)
- Detalles por prueba individual
- Tiempos de respuesta
- Códigos HTTP
- Cuerpo de respuesta (response body)
- Mensajes de error de aserciones

**Visualizaciones**:
- 8 tipos de gráficas diferentes (ver sección de Dashboard)
- Tabla detallada de resultados
- Top 15 requests con más fallos
- Panel de última ejecución

**Archivos clave**:
- `backend/src/controllers/postman.controller.ts`
- `backend/src/routes/postman.routes.ts`
- `frontend/src/app/core/postman.service.ts`

---

### 4. Módulo de Pruebas Playwright
**Propósito**: Ejecutar y analizar pruebas de interfaz de usuario (UI) automatizadas

**Funcionalidades**:
- Ejecución de pruebas de navegador (Chromium, Firefox, WebKit)
- Pruebas de componentes UI
- Validación de interacciones de usuario
- Screenshots y videos de ejecuciones
- Pruebas de accesibilidad

**Visualizaciones**:
- Dashboard idéntico al de Postman
- Métricas específicas de pruebas UI
- Análisis de tiempos de carga
- Detección de fallos visuales

**Archivos clave**:
- `backend/src/controllers/playwright.controller.ts`
- `backend/src/routes/playwright.routes.ts`
- `frontend/src/app/core/playwright.service.ts`

---

### 5. Dashboard de Visualización
**Propósito**: Proporcionar insights visuales sobre la calidad del software

#### 5.1 Componentes del Dashboard

##### A. Tarjetas KPI (4 tarjetas)
1. **Total Pruebas**: Número total de pruebas ejecutadas
2. **Aserciones**: Total de aserciones realizadas
3. **Fallos**: Cantidad de pruebas fallidas
4. **Tasa de Éxito**: Porcentaje de pruebas exitosas

**Características**:
- Gradientes de color según el tipo
- Íconos representativos
- Animaciones al cargar

##### B. Gráfica de Donut - Distribución de Resultados
- **Tipo**: Gráfica circular (donut)
- **Datos**: Exitosas vs Fallidas
- **Colores**: Verde (#10b981) para éxito, Rojo (#ef4444) para fallo
- **Interacción**: Tooltip con valores y porcentajes

##### C. Gráfica de Línea - Evolución de Tiempos de Respuesta
- **Tipo**: Gráfica de líneas
- **Eje X**: Nombres de pruebas (últimas 10)
- **Eje Y**: Tiempo de respuesta en ms
- **Características**: 
  - Línea suavizada
  - Relleno de área degradado
  - Puntos interactivos

##### D. Gráfica de Barras Agrupadas - Comparación HTTP Codes
- **Tipo**: Barras verticales agrupadas
- **Datos**: Comparación de códigos 200, 201, 400, 404, 500
- **Colores**: Verde (2xx), Amarillo (4xx), Rojo (5xx)
- **Uso**: Identificar patrones de respuestas HTTP

##### E. Gráfica de Barras Horizontales - Tiempos por Prueba
- **Tipo**: Barras horizontales
- **Ordenamiento**: De mayor a menor tiempo
- **Uso**: Identificar pruebas más lentas (Top 10)

##### F. Tabla de Detalles de Errores
- **Tipo**: Tabla HTML con datos en tiempo real
- **Columnas**: 
  - Prueba (nombre)
  - Aserción fallida
  - Mensaje de error
  - Timestamp
- **Filtrado**: Solo muestra pruebas con errores

##### G. Gráfica de Área - Distribución Temporal
- **Tipo**: Gráfica de área apilada
- **Datos**: Evolución de éxitos/fallos en el tiempo
- **Uso**: Tendencias de calidad

##### H. Gráfica de Barras Apiladas - Códigos HTTP por Test
- **Tipo**: Barras verticales apiladas
- **Datos**: Distribución de códigos HTTP por cada test
- **Uso**: Análisis detallado de respuestas

#### 5.2 Panel de Top Requests Fallidos
**Propósito**: Identificar los endpoints más problemáticos

**Características**:
- Top 15 requests con más fallos
- Barra de progreso visual para tasa de fallo
- Colores según severidad (verde→amarillo→rojo)
- Cálculos:
  - Total de ejecuciones
  - Total de fallos
  - Tasa de fallo (%)

**Ejemplo de visualización**:
```
GET /api/users/profile
Tasa de Fallo: 15.5%
[████████░░░░░░░░░░] 7/45 fallos
```

#### 5.3 Panel de Última Ejecución
**Propósito**: Mostrar detalles de la ejecución más reciente

**Características**:
- Filtrado por ventana de tiempo (últimos 5 minutos desde la ejecución más reciente)
- Métricas específicas de la última ejecución
- Tabla con resultados individuales
- Timestamp de ejecución

**Columnas de la tabla**:
- Nombre de prueba
- Código HTTP
- Tiempo de respuesta
- Estado (éxito/fallo)
- Mensaje de error (si aplica)

#### 5.4 Barra de Progreso de Ejecución en Tiempo Real
**Propósito**: Proporcionar feedback visual durante la ejecución de pruebas

**Características**:
- Barra de progreso animada
- Porcentaje de completitud
- Test actual en ejecución
- Tiempo estimado restante
- Tiempo transcurrido
- Contador de tests (X/Total)

**Funcionamiento**:
1. Se activa al iniciar ejecución de tests
2. Actualización cada 500ms
3. Cálculo de tiempo promedio por test
4. Estimación de tiempo restante
5. Desaparece al completar (duración estimada: ~3 minutos)

**Ejemplo visual**:
```
🔄 Ejecutando Pruebas...
[████████████░░░░░░░░] 65%

Prueba actual: POST /api/auth/login
Tests completados: 31/48
Tiempo transcurrido: 1m 30s
Tiempo estimado restante: 48s
```

**Archivos clave**:
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.ts` (líneas 1-2198)
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.html` (líneas 244-888)
- `frontend/src/app/pages/grafica-pruebas/grafica-pruebas.component.scss` (líneas 1-2156)

---

### 6. Módulo de Usuarios
**Propósito**: Gestionar usuarios del sistema

**Funcionalidades**:
- CRUD de usuarios
- Asignación de roles
- Visualización de actividad
- Control de permisos
- Tracking de última actividad

**Roles disponibles**:
- **Admin**: Acceso completo al sistema
- **QA Tester**: Ejecución y visualización de pruebas
- **Viewer**: Solo lectura

**Archivos clave**:
- `backend/src/controllers/users.controller.ts`
- `backend/src/routes/users.routes.ts`
- `frontend/src/app/pages/users-list/`

---

### 7. Módulo de Bugs
**Propósito**: Registro y seguimiento de defectos encontrados

**Funcionalidades**:
- Creación de bugs con detalle completo
- Estados: Abierto, En progreso, Resuelto, Cerrado
- Prioridades: Crítico, Alto, Medio, Bajo
- Asignación a usuarios
- Adjuntos y screenshots
- Historial de cambios
- Integración con resultados de pruebas

**Campos de un bug**:
- Título
- Descripción
- Pasos para reproducir
- Comportamiento esperado vs actual
- Severidad
- Prioridad
- Asignado a
- Proyecto relacionado
- Test que lo detectó

**Archivos clave**:
- `backend/src/controllers/bugs.controller.ts`
- `backend/src/models/bug.model.ts`
- `frontend/src/app/pages/bugs/`

---

### 8. Módulo de Tareas Automatizadas
**Propósito**: Programar ejecuciones periódicas de pruebas

**Funcionalidades**:
- Crear tareas programadas (cron jobs)
- Configurar frecuencia de ejecución
- Notificaciones por email
- Reportes automáticos
- Historial de ejecuciones

**Tipos de tareas**:
- Ejecución diaria de smoke tests
- Regression testing semanal
- Performance testing mensual
- Health checks cada hora

**Archivos clave**:
- `backend/src/controllers/automatedTasks.controller.ts`
- `backend/src/routes/automatedTasks.routes.ts`
- `frontend/src/app/pages/automated-tasks/`

---

## 🔧 Backend - API REST

### Estructura del Backend

```
backend/
├── src/
│   ├── app.ts                    # Configuración de Express
│   ├── server.ts                 # Punto de entrada
│   ├── config/
│   │   └── db.ts                # Configuración de MySQL
│   ├── controllers/             # Lógica de negocio
│   │   ├── auth.controller.ts
│   │   ├── postman.controller.ts
│   │   ├── playwright.controller.ts
│   │   ├── bugs.controller.ts
│   │   ├── users.controller.ts
│   │   └── ...
│   ├── middlewares/             # Middlewares personalizados
│   │   └── auth.ts             # Verificación JWT
│   ├── models/                  # Modelos de datos
│   │   ├── user.model.ts
│   │   ├── bug.model.ts
│   │   └── ...
│   └── routes/                  # Definición de rutas
│       ├── auth.routes.ts
│       ├── postman.routes.ts
│       └── ...
├── migrations/                  # Scripts de migración DB
├── package.json
└── tsconfig.json
```

### Endpoints Principales

#### Autenticación
```
POST   /api/auth/login          # Login de usuario
POST   /api/auth/register       # Registro de usuario
GET    /api/auth/me             # Obtener usuario actual
POST   /api/auth/logout         # Cerrar sesión
```

#### Postman
```
POST   /api/postman/test-retry                    # Ejecutar con reintentos
POST   /api/postman/contract-results              # Resultados de contrato
POST   /api/postman/controlled-response-results   # Resultados respuesta controlada
POST   /api/postman/response-results              # Resultados respuesta general
GET    /api/postman/latest-results                # Últimos resultados
GET    /api/postman/stats                         # Estadísticas generales
```

#### Playwright
```
POST   /api/playwright/execute                # Ejecutar pruebas
GET    /api/playwright/results                # Obtener resultados
GET    /api/playwright/stats                  # Estadísticas
POST   /api/playwright/contract-results       # Por tipo de prueba
POST   /api/playwright/controlled-response-results
POST   /api/playwright/response-results
```

#### Usuarios
```
GET    /api/users                 # Listar usuarios
GET    /api/users/:id            # Obtener usuario
POST   /api/users                # Crear usuario
PUT    /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario
GET    /api/users/online         # Usuarios online (Socket.io)
```

#### Bugs
```
GET    /api/bugs                 # Listar bugs
GET    /api/bugs/:id            # Obtener bug
POST   /api/bugs                # Crear bug
PUT    /api/bugs/:id            # Actualizar bug
DELETE /api/bugs/:id            # Eliminar bug
GET    /api/bugs/project/:id    # Bugs por proyecto
```

#### Tareas Automatizadas
```
GET    /api/automated-tasks              # Listar tareas
POST   /api/automated-tasks              # Crear tarea
PUT    /api/automated-tasks/:id         # Actualizar tarea
DELETE /api/automated-tasks/:id         # Eliminar tarea
POST   /api/automated-tasks/:id/execute # Ejecutar tarea manualmente
```

### Configuración de CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:4200` (desarrollo local)
- `http://localhost:4000` (mismo servidor)
- `https://flying-pleasing-stag.ngrok-free.app` (túnel ngrok)
- Cualquier subdominio de `*.ngrok-free.app`
- Cualquier subdominio de `*.ngrok.io`

**Métodos permitidos**: GET, POST, PUT, DELETE, PATCH, OPTIONS

**Headers permitidos**: Content-Type, Authorization, ngrok-skip-browser-warning

---

## 🎨 Frontend - Angular

### Estructura del Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Servicios principales
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── postman.service.ts
│   │   │   ├── playwright.service.ts
│   │   │   ├── bugs.service.ts
│   │   │   └── users.service.ts
│   │   ├── pages/                   # Páginas/Componentes
│   │   │   ├── login/
│   │   │   ├── grafica-pruebas/    # Dashboard principal
│   │   │   ├── bugs/
│   │   │   ├── users-list/
│   │   │   ├── automated-tasks/
│   │   │   └── estadisticas/
│   │   ├── shared/                  # Componentes compartidos
│   │   │   └── timer.pipe.ts
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── assets/                      # Recursos estáticos
│   ├── environments/                # Configuración por ambiente
│   ├── styles.scss                  # Estilos globales
│   └── index.html
├── proxy.conf.json                  # Configuración del proxy
├── angular.json
└── package.json
```

### Servicios Principales

#### AuthService
**Propósito**: Gestionar autenticación y sesión

**Métodos principales**:
```typescript
login(email: string, password: string): Observable<LoginResponse>
logout(): void
getToken(): string | null
isAuthenticated(): boolean
getCurrentUser(): User
```

#### PostmanService
**Propósito**: Interactuar con API de Postman

**Métodos principales**:
```typescript
executeWithRetry(request: PostmanExecutionRequest): Observable<PostmanExecutionResponse>
getContractResults(projectId: string): Observable<PostmanResult[]>
getControlledResponseResults(projectId: string): Observable<PostmanResult[]>
getResponseResults(projectId: string): Observable<PostmanResult[]>
```

#### PlaywrightService
**Propósito**: Gestionar pruebas de Playwright

**Métodos principales**:
```typescript
executeTests(config: PlaywrightConfig): Observable<PlaywrightResult>
getResults(projectId: string): Observable<PlaywrightResult[]>
getStats(projectId: string): Observable<PlaywrightStats>
```

### Guards y Interceptors

#### AuthGuard
**Propósito**: Proteger rutas que requieren autenticación

**Uso**:
```typescript
{
  path: 'pruebas',
  component: GraficaPruebasComponent,
  canActivate: [AuthGuard]
}
```

#### AuthInterceptor
**Propósito**: Agregar token JWT a todas las peticiones HTTP

**Funcionalidad**:
- Intercepta todas las peticiones HTTP
- Añade header `Authorization: Bearer <token>`
- Maneja errores 401 (no autorizado)

### Configuración del Proxy

El archivo `proxy.conf.json` redirige peticiones para evitar CORS:

```json
{
  "/api": {
    "target": "http://localhost:4000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/socket.io": {
    "target": "http://localhost:4000",
    "ws": true,
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

**Funcionamiento**:
1. Frontend hace petición a `/api/users`
2. Proxy intercepta y redirige a `http://localhost:4000/api/users`
3. Respuesta se devuelve al frontend
4. No hay problema de CORS (misma origen desde la perspectiva del navegador)

---

## 💾 Base de Datos

### Esquema de Base de Datos

#### Tabla: users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'qa_tester', 'viewer') DEFAULT 'qa_tester',
  last_active TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabla: postman_results
```sql
CREATE TABLE postman_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(100),
  test_type ENUM('contract', 'controlled_response', 'response') NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  http_code INT,
  response_time INT,
  response_body TEXT,
  status ENUM('passed', 'failed') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: postman_assertions
```sql
CREATE TABLE postman_assertions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT,
  assertion_name VARCHAR(255),
  assertion_status ENUM('passed', 'failed'),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES postman_results(id) ON DELETE CASCADE
);
```

#### Tabla: playwright_results
```sql
CREATE TABLE playwright_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(100),
  test_type ENUM('contract', 'controlled_response', 'response') NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  browser VARCHAR(50),
  duration INT,
  status ENUM('passed', 'failed', 'skipped') NOT NULL,
  error_message TEXT,
  screenshot_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: bugs
```sql
CREATE TABLE bugs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  priority ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  project_id VARCHAR(100),
  test_id INT,
  assigned_to INT,
  reporter_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);
```

#### Tabla: automated_tasks
```sql
CREATE TABLE automated_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  task_type ENUM('postman', 'playwright') NOT NULL,
  project_id VARCHAR(100),
  cron_expression VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_execution TIMESTAMP NULL,
  next_execution TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Migraciones

Las migraciones se encuentran en `backend/migrations/`:

1. **create_bugs_table.sql**: Crea tabla de bugs
2. **add_last_active_to_users.sql**: Añade campo de última actividad
3. **add_response_body_to_postman_results.sql**: Añade campo de cuerpo de respuesta

**Ejecución de migraciones**:
```bash
cd backend
mysql -u root -p qa_manager < migrations/nombre_migracion.sql
```

---

## ⚙️ Configuración y Despliegue

### Requisitos del Sistema

**Software necesario**:
- Node.js v18 o superior
- MySQL 8.0 o superior
- NPM v9 o superior
- Ngrok (para exposición pública)

**Puertos utilizados**:
- 4200: Frontend Angular
- 4000: Backend Node.js
- 3306: MySQL Database

### Variables de Entorno

Crear archivo `.env` en `backend/`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=qa_manager

# Autenticación
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Servidor
PORT=4000
NODE_ENV=development

# Postman (opcional)
POSTMAN_API_KEY=tu_api_key_postman

# Email (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_app
```

### Instalación Paso a Paso

#### 1. Clonar repositorio
```bash
git clone <repository-url>
cd Manager
```

#### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

#### 3. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

#### 4. Configurar base de datos
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE qa_manager;
exit;

# Ejecutar migraciones
cd ../backend
mysql -u root -p qa_manager < migrations/create_bugs_table.sql
mysql -u root -p qa_manager < migrations/add_last_active_to_users.sql
mysql -u root -p qa_manager < migrations/add_response_body_to_postman_results.sql
```

#### 5. Configurar variables de entorno
```bash
cd backend
cp .env.example .env
# Editar .env con tus valores
```

#### 6. Iniciar backend
```bash
cd backend
npm run dev
```

#### 7. Iniciar frontend
```bash
cd frontend
npm run start
```

#### 8. Exponer con Ngrok (opcional)
```bash
cd frontend
npm run ngrok
```

### Scripts NPM Disponibles

**Backend**:
```json
{
  "dev": "nodemon --exec ts-node src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

**Frontend**:
```json
{
  "start": "ng serve --host 0.0.0.0 --disable-host-check --proxy-config proxy.conf.json",
  "start-dev": "ng serve --proxy-config proxy.conf.json",
  "build": "ng build",
  "ngrok": "ngrok http --url=flying-pleasing-stag.ngrok-free.app 4200"
}
```

---

## 🔌 Integraciones

### Socket.io - Comunicación en Tiempo Real

**Propósito**: Notificaciones instantáneas de eventos del sistema

**Eventos disponibles**:
```typescript
// Cliente escucha
socket.on('test:started', (data) => { ... })
socket.on('test:progress', (data) => { ... })
socket.on('test:completed', (data) => { ... })
socket.on('test:failed', (data) => { ... })
socket.on('user:connected', (data) => { ... })
socket.on('user:disconnected', (data) => { ... })

// Cliente emite
socket.emit('join:project', { projectId: 'yamaha' })
socket.emit('start:test', { testType: 'postman' })
```

**Uso en el frontend**:
```typescript
constructor() {
  this.socket = io('/', { path: '/socket.io' });
  
  this.socket.on('test:progress', (progress) => {
    this.executionProgress = progress;
  });
}
```

### Newman (Postman CLI)

**Propósito**: Ejecutar colecciones de Postman desde el backend

**Configuración**:
```typescript
newman.run({
  collection: require('./collections/yamaha-api.json'),
  environment: require('./environments/staging.json'),
  reporters: ['cli', 'json'],
  insecure: true,
  timeout: 30000
}, (err, summary) => {
  // Procesar resultados
});
```

### Playwright

**Propósito**: Automatización de pruebas de navegador

**Ejemplo de test**:
```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('https://app.example.com');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

### Chart.js - Visualización de Datos

**Configuración global**:
```typescript
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

**Ejemplo de gráfica**:
```typescript
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Exitosas', 'Fallidas'],
    datasets: [{
      data: [85, 15],
      backgroundColor: ['#10b981', '#ef4444']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true }
    }
  }
});
```

---

## 📖 Guía de Uso

### Para Testers QA

#### 1. Acceder al Sistema
1. Navegar a `https://flying-pleasing-stag.ngrok-free.app`
2. Iniciar sesión con credenciales proporcionadas
3. Seleccionar el menú "Pruebas"

#### 2. Seleccionar Proyecto
1. En la pantalla principal, visualizar tarjetas de proyectos disponibles
2. Hacer clic en el proyecto deseado (ej: Yamaha)
3. Verificar el estado del proyecto (badge "ACTIVO")

#### 3. Ejecutar Pruebas Postman
1. Hacer clic en "Pruebas de Postman"
2. Seleccionar tipo de prueba:
   - **Contrato**: Validación de estructura
   - **Respuesta Controlada**: Escenarios específicos
   - **Respuesta General**: Flujos completos
3. Hacer clic en "Ejecutar Pruebas"
4. Observar barra de progreso en tiempo real
5. Esperar a que la ejecución complete (~3 minutos)

#### 4. Analizar Resultados
1. **Revisar KPIs**: Métricas generales en la parte superior
2. **Explorar gráficas**:
   - Donut: Distribución éxito/fallo
   - Línea: Evolución de tiempos
   - Barras: Comparación de códigos HTTP
3. **Revisar tabla de detalles**: Información completa de cada test
4. **Identificar problemas**: Panel "Top Requests Fallidos"
5. **Última ejecución**: Detalles de la ejecución más reciente

#### 5. Reportar Bugs
1. Si se encuentra un fallo, hacer clic en "Reportar Bug"
2. Completar formulario:
   - Título descriptivo
   - Descripción detallada
   - Pasos para reproducir
   - Severidad y prioridad
3. Adjuntar screenshots si es necesario
4. Guardar bug

#### 6. Ejecutar Pruebas Playwright
1. Similar al flujo de Postman
2. Seleccionar "Pruebas de Playwright"
3. Elegir tipo de prueba
4. Ejecutar y analizar resultados

### Para Administradores

#### 1. Gestión de Usuarios
1. Navegar a "Usuarios"
2. Ver lista de usuarios activos
3. Crear nuevo usuario:
   - Completar datos básicos
   - Asignar rol
   - Establecer permisos
4. Editar usuarios existentes
5. Desactivar cuentas si es necesario

#### 2. Configurar Tareas Automatizadas
1. Ir a "Tareas Automatizadas"
2. Crear nueva tarea:
   - Nombre y descripción
   - Tipo (Postman o Playwright)
   - Proyecto asociado
   - Expresión cron (ej: `0 9 * * *` para diario a las 9am)
3. Activar tarea
4. Configurar notificaciones por email

#### 3. Monitorear Sistema
1. Dashboard de estadísticas
2. Ver usuarios conectados (tiempo real)
3. Revisar historial de ejecuciones
4. Exportar reportes

### Casos de Uso Comunes

#### Caso 1: Smoke Testing Diario
**Objetivo**: Verificar funcionalidad básica cada mañana

**Pasos**:
1. Crear tarea automatizada
2. Tipo: Postman - Respuesta General
3. Cron: `0 6 * * 1-5` (6am, lunes a viernes)
4. Notificaciones: Enviar email si hay fallos
5. Activar tarea

#### Caso 2: Regression Testing Pre-Release
**Objetivo**: Validar toda la suite antes de liberar

**Pasos**:
1. Ejecutar manualmente:
   - Pruebas de Contrato
   - Pruebas de Respuesta Controlada
   - Pruebas de Respuesta General
2. Analizar dashboard completo
3. Verificar tasa de éxito > 95%
4. Reportar bugs críticos inmediatamente
5. Generar reporte consolidado

#### Caso 3: Investigación de Bug Reportado
**Objetivo**: Reproducir y diagnosticar un defecto

**Pasos**:
1. Ir a "Bugs" → Buscar bug reportado
2. Leer descripción y pasos
3. Ejecutar prueba relacionada específicamente
4. Revisar response body en tabla de detalles
5. Verificar códigos HTTP y tiempos de respuesta
6. Actualizar bug con hallazgos
7. Asignar a desarrollador

---

## 🚀 Mejores Prácticas

### Para Desarrollo

1. **Usar branches separados** para features
2. **Ejecutar pruebas localmente** antes de commit
3. **Documentar cambios** en el código
4. **Seguir convenciones** de TypeScript/Angular
5. **Revisar CORS** al agregar nuevos endpoints

### Para Testing

1. **Nombrar pruebas descriptivamente**
2. **Agrupar pruebas relacionadas**
3. **Mantener assertions específicas**
4. **Documentar casos edge**
5. **Reportar bugs inmediatamente**

### Para Producción

1. **Usar variables de entorno** para secretos
2. **Habilitar HTTPS** en ngrok
3. **Configurar backups** de base de datos
4. **Monitorear logs** regularmente
5. **Actualizar dependencias** periódicamente

---

## 🔍 Troubleshooting

### Problema: Errores de CORS
**Síntomas**: 
```
Access to XMLHttpRequest at 'http://localhost:4000/api/...' from origin 
'https://flying-pleasing-stag.ngrok-free.app' has been blocked by CORS policy
```

**Solución**:
1. Verificar que el backend esté corriendo con `npm run dev`
2. Confirmar configuración CORS en `backend/src/app.ts`
3. Asegurar que frontend use rutas relativas (`/api/...` no `http://localhost:4000/api/...`)
4. Reiniciar backend después de cambios en CORS
5. Verificar que proxy esté configurado en `proxy.conf.json`
6. Usar `npm run start` (no `ng serve` directo) para habilitar proxy

### Problema: Socket.io no conecta
**Síntomas**: No hay actualizaciones en tiempo real

**Solución**:
1. Verificar que backend tenga Socket.io iniciado
2. Revisar configuración en `auth.service.ts`:
   ```typescript
   this.socket = io('/', { path: '/socket.io' });
   ```
3. Confirmar proxy para `/socket.io` en `proxy.conf.json`
4. Verificar WebSocket support en ngrok

### Problema: Pruebas no ejecutan
**Síntomas**: Botón "Ejecutar" no hace nada

**Solución**:
1. Abrir DevTools → Console para ver errores
2. Verificar que colecciones Postman existan en backend
3. Revisar permisos del usuario (rol)
4. Confirmar que proyecto tenga suites configuradas
5. Revisar logs del backend para errores de Newman

### Problema: Base de datos no conecta
**Síntomas**: 
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**Solución**:
1. Verificar credenciales en `.env`
2. Confirmar que MySQL esté corriendo: `mysql -u root -p`
3. Crear base de datos si no existe: `CREATE DATABASE qa_manager;`
4. Otorgar permisos: `GRANT ALL ON qa_manager.* TO 'root'@'localhost';`
5. Ejecutar migraciones faltantes

---

## 📊 Métricas y KPIs

### Métricas de Calidad

**Tasa de Éxito**:
```
Tasa de Éxito = (Pruebas Exitosas / Total Pruebas) × 100
```
- **Objetivo**: > 95%
- **Crítico**: < 85%

**Tiempo Promedio de Respuesta**:
```
Tiempo Promedio = Σ(Tiempos de Respuesta) / Total Pruebas
```
- **Objetivo**: < 500ms
- **Advertencia**: > 1000ms

**Tasa de Fallo por Endpoint**:
```
Tasa Fallo = (Fallos del Endpoint / Total Llamadas) × 100
```
- **Objetivo**: < 5%
- **Crítico**: > 15%

### Dashboard de Métricas

El dashboard proporciona visualización en tiempo real de:
- **Cobertura de pruebas**: % de endpoints testeados
- **Tendencias**: Evolución histórica de éxito/fallo
- **Performance**: Análisis de tiempos de respuesta
- **Estabilidad**: Consistencia de resultados

---

## 🔐 Seguridad

### Autenticación
- JWT tokens con expiración de 7 días
- Passwords hasheados con bcrypt
- Refresh tokens para sesiones largas
- Logout que invalida token

### Autorización
- Guards en rutas protegidas
- Verificación de roles en backend
- Middlewares de autenticación
- Permisos granulares por recurso

### Mejores Prácticas
1. **No commitear** archivos `.env`
2. **Rotar secrets** regularmente
3. **Usar HTTPS** en producción
4. **Sanitizar inputs** del usuario
5. **Validar tokens** en cada request
6. **Limitar rate** de peticiones

---

## 📞 Soporte

### Contactos
- **Desarrollador Principal**: [Tu nombre]
- **Email**: [Tu email]
- **Slack**: [Canal de QA]

### Recursos Adicionales
- **Documentación de Newman**: https://www.npmjs.com/package/newman
- **Documentación de Playwright**: https://playwright.dev
- **Angular Docs**: https://angular.io/docs
- **Chart.js Docs**: https://www.chartjs.org/docs

---

## 📝 Changelog

### Versión 2.0.0 (Noviembre 2025)
- ✅ Dashboard con 8 visualizaciones
- ✅ Panel de top requests fallidos
- ✅ Panel de última ejecución
- ✅ Barra de progreso en tiempo real
- ✅ Campo response_body en resultados
- ✅ Mejoras de UI/UX en tarjetas de proyecto
- ✅ Navegación con breadcrumbs elegantes
- ✅ Configuración completa de CORS para ngrok
- ✅ Proxy de Angular para evitar CORS

### Versión 1.5.0
- ✅ Integración de Socket.io
- ✅ Módulo de bugs
- ✅ Tareas automatizadas

### Versión 1.0.0
- ✅ Lanzamiento inicial
- ✅ Autenticación básica
- ✅ Ejecución de pruebas Postman

---

## 🎯 Roadmap Futuro

### Corto Plazo (1-2 meses)
- [ ] Integración con Jira para bugs
- [ ] Reportes en PDF/Excel
- [ ] Dashboard personalizable
- [ ] Notificaciones push
- [ ] API pública con documentación Swagger

### Mediano Plazo (3-6 meses)
- [ ] Integración con CI/CD (Jenkins, GitHub Actions)
- [ ] Pruebas de performance (K6, JMeter)
- [ ] Machine Learning para predecir fallos
- [ ] Mobile app (React Native)
- [ ] Multi-tenancy para múltiples empresas

### Largo Plazo (6-12 meses)
- [ ] IA para generación automática de tests
- [ ] Análisis de cobertura de código
- [ ] Integración con APM tools
- [ ] Cloud deployment (AWS/Azure)
- [ ] Marketplace de plugins

---

## 📄 Licencia

Este software es propiedad de [Tu Empresa]. Todos los derechos reservados.

**Uso interno únicamente**. No distribuir sin autorización.

---

**Última actualización**: 11 de Noviembre de 2025
**Versión del documento**: 2.0.0
**Autor**: [Camilo Soto]
