<!-- ============================================
     FLUJO COMPLETO: CREAR PROYECTOS, SUITES Y CASOS
     ============================================ -->

# 📚 Guía Completa: Crear Casos de Prueba en TestOmat

## 🎯 Flujo General

```
Crear Proyecto
    ↓
Crear Suite(s) en el Proyecto
    ↓
Crear Caso(s) de Prueba en la Suite
    ↓
Definir Steps (Pasos) en cada Caso
    ↓
Ejecutar Pruebas
    ↓
Ver Resultados
```

---

## ✅ Paso 1: Crear un Proyecto

### 📍 Ubicación: `/testomat` (Menú → TestOmat)

**Acción:**
1. Click en botón **"Nuevo Proyecto"**
2. Completa el formulario:
   - **Nombre**: Identificador único (Ej: "QA Manager - Frontend")
   - **Descripción**: Contexto del proyecto
   - **Estado**: Draft/Ready/Deprecated

**Resultado:**
- Proyecto creado en la base de datos
- Se guarda con fecha de creación

**Código:**
```typescript
// TestomatService
createTestProject(project: TestProject): Observable<TestProject>
// Backend: POST /api/testomat/projects
```

---

## ✅ Paso 2: Crear una Suite

### 📍 Ubicación: `/testomat/suites` (click en proyecto)

**Acción:**
1. Selecciona un proyecto en la lista
   - Se carga automáticamente con `TestomatService.currentProject$`
2. Click en botón **"Nueva Suite"**
3. Completa el formulario:
   - **Nombre**: Ej: "Autenticación"
   - **Descripción**: Ej: "Pruebas de login y registro"
   - **Estado**: Draft/Ready/Deprecated

**Diagrama:**
```
Proyectos (Tabla)
    ↓ [Click en proyecto]
    ↓ setCurrentProject(project)
    ↓
Suites (Se carga automáticamente)
    └─ currentProject$ Observable
       └─ getTestSuites(projectId)
```

**Código:**
```typescript
// 1. Seleccionar proyecto
selectProject(project: TestProject): void {
  this.testomatService.setCurrentProject(project);
  // Esto dispara el observable en TestSuitesComponent.ngOnInit()
}

// 2. Crear suite
saveSuite(): void {
  const suiteData: TestSuite = {
    project_id: this.currentProject.id,
    name: 'Autenticación',
    description: '...',
    status: 'draft'
  };
  
  this.testomatService.createTestSuite(projectId, suiteData)
    .subscribe(newSuite => {
      this.suites.push(newSuite);
    });
}
```

---

## ✅ Paso 3: Crear Casos de Prueba

### 📍 Ubicación: `/testomat/casos?suiteId=X`

**Acción:**
1. En la tabla de Suites, click en ícono **"Ver casos"**
   - Se abre página de casos con `?suiteId=X`
2. Click en botón **"Nuevo Caso"**
3. Completa el formulario completo:

### 📋 Formulario de Caso

#### **Datos Básicos:**
- **Nombre**: (Ej: "Validar login con email y contraseña válidos")
- **Descripción**: Contexto del caso
- **Tipo de Prueba**: Funcional/Regresión/Smoke/etc.

#### **Atributos:**
- **Prioridad**: Critical/High/Medium/Low
- **Automatización**: Manual/Semi-automatizado/Automatizado
- **Estado**: Draft/Ready/Deprecated

#### **Contexto:**
- **Precondiciones**: (Ej: "Usuario debe estar registrado")
- **Postcondiciones**: (Ej: "Usuario logueado, sesión activa")

#### **Steps (Lo importante!):**
```
Para cada paso:
  1. Descripción: "Ingresar email en campo de login"
  2. Resultado Esperado: "Campo acepta entrada de texto"
  
  3. Descripción: "Ingresar contraseña"
  4. Resultado Esperado: "Contraseña se oculta con asteriscos"
  
  5. Descripción: "Click en botón Login"
  6. Resultado Esperado: "Usuario es redirigido a dashboard"
```

**Botón "+ Agregar Paso"** para agregar más pasos.

---

## 📝 Estructura de Datos

### TestCase (Con Steps)
```typescript
{
  id: 1,
  suite_id: 5,           // FK a la suite
  name: "Login correcto",
  description: "Validar que un usuario pueda loguearse...",
  priority: "high",
  automation_status: "automated",
  test_type: "functional",
  status: "ready",
  preconditions: "Usuario registrado en el sistema",
  postconditions: "Sesión activa",
  steps: [
    {
      order: 1,
      description: "Ingresar email",
      expected_result: "Campo acepta texto"
    },
    {
      order: 2,
      description: "Ingresar contraseña",
      expected_result: "Texto se oculta con asteriscos"
    },
    {
      order: 3,
      description: "Click botón Login",
      expected_result: "Redirige a dashboard"
    }
  ],
  tags: ["authentication", "critical"],
  created_by: 1,
  created_at: "2025-01-18T10:30:00Z"
}
```

### Suite
```typescript
{
  id: 5,
  project_id: 1,
  name: "Autenticación",
  description: "Pruebas de login y registro",
  status: "ready",
  created_at: "2025-01-18T09:00:00Z"
}
```

### Project
```typescript
{
  id: 1,
  name: "QA Manager",
  description: "Sistema de gestión de casos de prueba",
  status: "ready",
  owner_id: 1,
  created_at: "2025-01-18T08:00:00Z"
}
```

---

## 🔄 Flujo de Componentes

```
app.component.html
    ↓ (Navegación)
    ↓ /testomat
    ↓
TestProjectsListComponent
    ├─ Muestra lista de proyectos
    ├─ onSelect → setCurrentProject()
    └─ Observa currentProject$ BehaviorSubject
        ↓
        TestSuitesComponent
        ├─ Se inicializa cuando hay currentProject
        ├─ Carga suites del proyecto
        ├─ onSelect → queryParams suiteId
        └─ Link a /testomat/casos?suiteId=X
            ↓
            TestCasesLibraryComponent
            ├─ Lee queryParams.suiteId
            ├─ Carga casos de la suite
            ├─ Muestra tabla con filtros
            └─ Modal para crear/editar casos
                └─ FormArray para steps
```

---

## 🛠️ Métodos Principales

### TestomatService
```typescript
// Proyectos
getTestProjects()                      // GET /api/testomat/projects
createTestProject(project)             // POST /api/testomat/projects
updateTestProject(id, project)         // PUT /api/testomat/projects/:id

// Suites
getTestSuites(projectId)               // GET /api/testomat/projects/:projectId/suites
createTestSuite(projectId, suite)      // POST /api/testomat/projects/:projectId/suites
updateTestSuite(suiteId, suite)        // PUT /api/testomat/suites/:suiteId

// Casos
getTestCases(suiteId)                  // GET /api/testomat/suites/:suiteId/cases
createTestCase(testCase)               // POST /api/testomat/cases
updateTestCase(caseId, testCase)       // PUT /api/testomat/cases/:caseId
getTestCaseById(caseId)                // GET /api/testomat/cases/:caseId

// State Management
setCurrentProject(project)
currentProject$ BehaviorSubject
testCases$ BehaviorSubject
```

---

## 📊 Ejemplo Completo (Step by Step)

### 1️⃣ Crear Proyecto
```bash
POST /api/testomat/projects
{
  "name": "QA Manager Frontend",
  "description": "Automatización del módulo de gestión de casos",
  "status": "draft"
}
↓ Response
{ id: 42, name: "QA Manager Frontend", ... }
```

### 2️⃣ Crear Suite
```bash
POST /api/testomat/projects/42/suites
{
  "project_id": 42,
  "name": "Formularios",
  "description": "Pruebas de validación de formularios",
  "status": "draft"
}
↓ Response
{ id: 85, project_id: 42, name: "Formularios", ... }
```

### 3️⃣ Crear Caso de Prueba
```bash
POST /api/testomat/cases
{
  "suite_id": 85,
  "name": "Validar campo nombre obligatorio",
  "description": "Si nombre está vacío, muestra error",
  "priority": "high",
  "automation_status": "automated",
  "test_type": "functional",
  "status": "ready",
  "preconditions": "Formulario abierto",
  "postconditions": "Error mostrado",
  "steps": [
    { order: 1, description: "Dejar nombre en blanco", expected_result: "Campo vacío" },
    { order: 2, description: "Click en Submit", expected_result: "Error rojo" },
    { order: 3, description: "Mensaje de error", expected_result: "Dice 'Campo requerido'" }
  ]
}
↓ Response
{ id: 156, suite_id: 85, name: "Validar campo...", steps: [...], ... }
```

---

## 🎨 Características de UI

### TestProjectsListComponent
- ✅ Tabla con proyectos
- ✅ Modal para crear/editar
- ✅ Selectores con click en fila
- ✅ Tema oscuro

### TestSuitesComponent
- ✅ Se carga automáticamente cuando hay proyecto
- ✅ Tabla con suites
- ✅ Modal para crear/editar
- ✅ Links a casos con queryParams

### TestCasesLibraryComponent
- ✅ Tabla con casos
- ✅ Filtros: Prioridad, Automatización, Búsqueda
- ✅ Modal completo con FormArray para steps
- ✅ Editor visual de pasos (drag, delete, add)
- ✅ Validaciones de formularios

---

## 🔐 Protecciones

```typescript
// Todas las rutas tienen AuthGuard
{ path: 'testomat', component: TestProjectsListComponent, canActivate: [AuthGuard] }
{ path: 'testomat/suites', component: TestSuitesComponent, canActivate: [AuthGuard] }
{ path: 'testomat/casos', component: TestCasesLibraryComponent, canActivate: [AuthGuard] }

// Backend: Middleware de auth en todas las rutas
router.get('/projects', auth, getTestProjects)
router.post('/projects', auth, createTestProject)
// ... todas protegidas
```

---

## 📱 Responsive Design

- Tablas adaptables en móvil
- Modales se ajustan al viewport
- Filtros en rows apiladas en móvil
- Botones con iconos + texto

---

## ❌ Validaciones

### Proyecto
- ✅ Nombre: 3+ caracteres, único
- ✅ Descripción: opcional
- ✅ Estado: draft/ready/deprecated

### Suite
- ✅ Nombre: 3+ caracteres
- ✅ Descripción: opcional
- ✅ project_id: requerido

### Caso de Prueba
- ✅ Nombre: 5+ caracteres
- ✅ Suite ID: requerido
- ✅ Priority: one of [low, medium, high, critical]
- ✅ Automation: one of [manual, semi-automated, automated]
- ✅ Test Type: one of [functional, regression, smoke, integration, performance, security]
- ✅ Steps: mínimo 1, máximo ilimitado
- ✅ Cada step debe tener descripción y resultado esperado

---

## 🚀 Próximos Pasos

1. **Test Execution Runner** - Correr pruebas y registrar resultados
2. **Results Viewer** - Ver reports de ejecuciones
3. **TestOmat.io Importer** - Migrar datos desde TestOmat.io
4. **Analytics Dashboard** - Métricas y gráficos
5. **Export/Import** - Exportar casos a CSV/JSON

