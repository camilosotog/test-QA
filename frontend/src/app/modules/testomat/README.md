# 📦 MÓDULO TESTOMAT - Sistema de Gestión de Casos de Prueba

Módulo completo de Angular para la gestión de proyectos de prueba, casos, ejecuciones y resultados. Reemplaza TestOmat.io como proveedor de gestión de pruebas.

## 📁 Estructura

```
src/app/modules/testomat/
├── components/
│   ├── test-projects-list.component.ts      # Lista y gestión de proyectos
│   ├── test-projects-list.component.html    # Template del listado
│   ├── test-projects-list.component.scss    # Estilos con tema oscuro
│   └── test-projects-list.component.spec.ts # Tests unitarios
├── services/
│   └── testomat.service.ts                  # Servicio HTTP + lógica
├── testomat.module.ts                       # Módulo Angular
└── index.ts                                 # Barrel export
```

## 🚀 Características Principales

### 1. **Gestión de Proyectos**
- ✅ Listar todos los proyectos
- ✅ Crear nuevos proyectos
- ✅ Editar proyectos existentes
- ✅ Estados: Draft, Ready, Deprecated

### 2. **Organización por Suites**
- Agrupar casos de prueba en suites
- Gestión jerárquica: Proyecto → Suite → Casos

### 3. **Casos de Prueba**
- Crear casos con:
  - Pasos de prueba (steps)
  - Prioridad (Low, Medium, High, Critical)
  - Tipo: Functional, Regression, Smoke, Integration, Performance, Security
  - Automatización: Manual, Automated, Semi-automated
  - Tags para clasificación
  - Precondiciones y postcondiciones

### 4. **Ejecución de Pruebas**
- Separación clara: Ejecución vs Resultados
- Rastreo de:
  - Ambiente de ejecución
  - Tiempo de inicio/fin
  - Estadísticas (total, passed, failed, skipped, blocked)
  - Tasa de éxito (success_rate)

### 5. **Resultados Detallados**
- Pass/Fail/Skip/Blocked
- Mensaje de error
- Tiempo de ejecución
- Screenshots
- Logs

### 6. **Importación**
- Importar casos desde TestOmat.io
- Mantener historial de importaciones
- Mapeo de configuraciones

### 7. **Analítica**
- Total de casos
- Casos automatizados vs manuales
- Tasa de éxito
- Tiempo de ejecución promedio
- Total de ejecuciones

## 🔧 Servicio TestomatService

### Métodos Principales

#### Proyectos
```typescript
getTestProjects(): Observable<TestProject[]>
getTestProjectById(projectId: number): Observable<TestProject>
createTestProject(project: TestProject): Observable<TestProject>
updateTestProject(projectId: number, project: Partial<TestProject>): Observable<TestProject>
```

#### Suites
```typescript
getTestSuites(projectId: number): Observable<TestSuite[]>
createTestSuite(projectId: number, suite: TestSuite): Observable<TestSuite>
```

#### Casos
```typescript
getTestCases(suiteId: number): Observable<TestCase[]>
getTestCaseById(caseId: number): Observable<TestCase>
createTestCase(testCase: TestCase): Observable<TestCase>
updateTestCase(caseId: number, testCase: Partial<TestCase>): Observable<TestCase>
searchTestCases(query: string, projectId?: number): Observable<TestCase[]>
```

#### Ejecuciones
```typescript
getTestExecutions(projectId: number): Observable<TestExecution[]>
getTestExecutionById(executionId: number): Observable<TestExecution>
createTestExecution(execution: TestExecution): Observable<ExecutionResponse>
executeTests(request: ExecuteTestsRequest): Observable<ExecutionResponse>
```

#### Resultados
```typescript
recordTestResult(result: TestResult): Observable<TestResult>
getExecutionResults(executionId: number): Observable<TestResult[]>
```

#### Analítica
```typescript
getProjectAnalytics(projectId: number): Observable<ProjectAnalytics>
```

### BehaviorSubjects (Estado Reactivo)
```typescript
currentProject$: BehaviorSubject<TestProject | null>
currentExecution$: BehaviorSubject<TestExecution | null>
executionResults$: BehaviorSubject<TestResult[]>
analytics$: BehaviorSubject<ProjectAnalytics | null>
testCases$: BehaviorSubject<TestCase[]>
```

## 📊 Componentes

### TestProjectsListComponent

**Función**: Mostrar, crear y editar proyectos de prueba

**Features**:
- Tabla responsive con proyectos
- Formulario modal para crear/editar
- Validación con FormBuilder
- Estados visuales (badges)
- Búsqueda y filtrado

**Propiedades**:
```typescript
projects: TestProject[] = []
loading = false
error: string | null = null
showForm = false
editingProjectId: number | null = null
projectForm: FormGroup
```

**Métodos**:
- `loadProjects()` - Carga desde backend
- `openCreateForm()` - Abre modal de creación
- `openEditForm(project)` - Abre modal de edición
- `saveProject()` - Guarda (create o update)
- `selectProject(project)` - Establece como actual
- `getStatusClass(status)` - Estilos del badge
- `getStatusText(status)` - Texto en español

## 🎨 Estilos

El componente TestProjectsListComponent incluye:
- Tema oscuro integrado (match con app)
- Animaciones smooth
- Gradientes modernos
- Responsive design (mobile-first)
- Hover effects y transiciones

## 🔗 Integración

### En app.module.ts
```typescript
import { TestomatModule } from './modules/testomat/testomat.module';

@NgModule({
  imports: [
    // ...
    TestomatModule
  ]
})
export class AppModule { }
```

### En app-routing.module.ts
```typescript
{ path: 'testomat', component: TestProjectsListComponent, canActivate: [AuthGuard] }
```

### En navegación
Se agregó automáticamente a la barra lateral con icono `bi-folder-check`

## 🗄️ Backend API

**Base URL**: `/api/testomat`

### Endpoints Disponibles

```
GET    /projects                          - Listar proyectos
POST   /projects                          - Crear proyecto
GET    /projects/:projectId               - Obtener proyecto
PUT    /projects/:projectId               - Actualizar proyecto
GET    /projects/:projectId/suites        - Listar suites
POST   /projects/:projectId/suites        - Crear suite
GET    /suites/:suiteId/cases             - Listar casos
POST   /cases                             - Crear caso
GET    /cases/:caseId                     - Obtener caso
PUT    /cases/:caseId                     - Actualizar caso
GET    /projects/:projectId/executions    - Listar ejecuciones
POST   /projects/:projectId/executions    - Crear ejecución
GET    /executions/:executionId           - Obtener ejecución
POST   /results                           - Registrar resultado
GET    /projects/:projectId/analytics     - Obtener analítica
POST   /import/testomat                   - Importar desde TestOmat.io
```

## 📦 Base de Datos

**Schema**: 8 tablas MySQL

```
projects
├── test_projects
│   ├── test_suites
│   │   └── test_cases
│   │       ├── test_executions
│   │       │   └── test_results
│   │       └── test_case_history
│   └── testomat_imports
```

**Características**:
- Relaciones con ON DELETE CASCADE/SET NULL
- Índices en columnas frecuentes
- Audit trail (test_case_history)
- Soporte para JSON (steps, tags, mappings)
- Enums para tipos de datos

## ✅ Testing

El componente incluye test suite (`spec.ts`) con:
- Pruebas de ciclo de vida
- Mocking del servicio
- Validación de formularios
- Manejo de errores
- Métodos auxiliares

```bash
# Ejecutar tests
ng test --include='**/testomat/**'
```

## 📝 Próximos Componentes

1. **TestSuitesComponent** - Gestión de suites
2. **TestCasesLibraryComponent** - Biblioteca de casos
3. **TestCaseDetailComponent** - Crear/editar casos con steps
4. **TestExecutionRunnerComponent** - Ejecutor de pruebas
5. **TestResultsViewerComponent** - Visualizador de resultados
6. **TestomatImporterComponent** - Importador desde TestOmat.io

## 🚀 Uso Básico

### 1. Inyectar el servicio
```typescript
constructor(private testomatService: TestomatService) {}
```

### 2. Obtener proyectos
```typescript
this.testomatService.getTestProjects().subscribe(projects => {
  console.log(projects);
});
```

### 3. Crear proyecto
```typescript
const newProject: TestProject = {
  name: 'Mi Proyecto',
  description: 'Descripción',
  status: 'draft'
};
this.testomatService.createTestProject(newProject).subscribe(created => {
  console.log('Proyecto creado:', created);
});
```

### 4. Usar estado reactivo
```typescript
this.testomatService.currentProject$.subscribe(project => {
  console.log('Proyecto actual:', project);
});
```

## 📋 Información Técnica

- **Framework**: Angular 17
- **HTTP Client**: HttpClientModule
- **Forms**: Reactive Forms (FormBuilder)
- **State Management**: RxJS BehaviorSubjects
- **Styling**: SCSS con variables CSS
- **Auth**: Token-based con interceptor
- **Guards**: AuthGuard en rutas

## 🔒 Seguridad

- Todas las rutas protegidas con `AuthGuard`
- Token JWT en headers (vía interceptor)
- Validación en formularios
- Sanitización de entrada (Angular built-in)
- CORS habilitado en backend

## 📞 Contacto

Para preguntas o sugerencias sobre el módulo TestOmat:
- Revisar logs en la consola del navegador
- Verificar estado del backend: `http://localhost:4000`
- Comprobar base de datos MySQL

---

**Última actualización**: 18 de noviembre de 2025
**Versión**: 1.0.0
**Estado**: ✅ Producción (Módulo base completo)
