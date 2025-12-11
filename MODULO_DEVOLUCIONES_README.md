# 📋 Módulo de Devoluciones de Análisis de Requerimientos

## Descripción General

Se ha implementado un nuevo módulo completo para registrar, monitorear y analizar **devoluciones de análisis de requerimientos por PO y mes**. Este módulo permite que el equipo de QA documente cuándo un requerimiento es devuelto al Product Owner (PO) para ajustes, con fecha automática y análisis estadístico.

---

## Características Principales

✅ **Registro de Devoluciones**
- Seleccionar PO de lista predefinida (Juan David Jimenez, Alejandro Suarez, Sebastian Chaves, Jonnat Torres, Adalberto Salas)
- Ingresar código de tarea
- Documentar motivo de devolución
- Fecha automática (del sistema)

✅ **Listado Completo**
- Ver todas las devoluciones registradas
- Filtrar por PO y código de tarea
- Editar devoluciones existentes
- Eliminar devoluciones (soft delete)

✅ **Análisis Estadístico**
- Ver devoluciones por mes
- Estadísticas agrupadas por PO
- Contar total de devoluciones
- Calcular promedio por PO

---

## Acceso

**URL:** `http://localhost:4200/devoluciones`

**Permisos:** Todos los usuarios autenticados pueden acceder

**Ubicación en menú:** 📋 Devoluciones (lado izquierdo, en el sidebar)

---

## Flujo de Uso

### 1. Registrar una Nueva Devolución

1. Haz clic en la pestaña **"➕ Nueva Devolución"**
2. Selecciona un PO de la lista desplegable
3. Ingresa el código de tarea (ej: TASK-123, REQ-001)
4. Escribe el motivo de devolución
5. Haz clic en **"➕ Registrar"**
6. ¡Listo! La devolución se registra automáticamente con la fecha y hora actual

### 2. Ver Listado de Devoluciones

1. Haz clic en la pestaña **"📝 Listado"**
2. Opcionalmente aplica filtros:
   - Filtra por nombre de PO
   - Filtra por código de tarea
3. Haz clic en **"🔍 Filtrar"** para aplicar
4. Usa **"🔄 Limpiar"** para resetear filtros

**Acciones disponibles:**
- ✏️ **Editar:** Modifica cualquier campo de la devolución
- 🗑️ **Eliminar:** Marca como inactiva (no desaparece de BD)

### 3. Analizar Estadísticas

1. Haz clic en la pestaña **"📊 Estadísticas"**
2. Selecciona un mes haciendo clic en los botones (Enero a Diciembre)
3. Verás:
   - Tabla con devoluciones por PO en ese mes
   - **Total de devoluciones**
   - **POs involucrados**
   - **Promedio por PO**

---

## Estructura de Base de Datos

### Tabla: `requirement_returns`

```sql
CREATE TABLE IF NOT EXISTS `requirement_returns` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `po_name` VARCHAR(255) NOT NULL,           -- Nombre del PO
  `task_code` VARCHAR(100) NOT NULL,         -- Código de tarea
  `return_reason` TEXT NOT NULL,             -- Motivo de devolución
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha automática
  `is_active` TINYINT(1) DEFAULT 1,          -- Soft delete
  PRIMARY KEY (`id`),
  INDEX `idx_po_name` (`po_name`),
  INDEX `idx_task_code` (`task_code`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Endpoints API Backend

**Base URL:** `/api/requirement-returns`

### Endpoints Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar devoluciones (con filtros opcionales) |
| GET | `/:id` | Obtener una devolución por ID |
| POST | `/` | Crear nueva devolución |
| PUT | `/:id` | Actualizar devolución existente |
| DELETE | `/:id` | Eliminar (soft delete) devolución |
| GET | `/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Devoluciones por rango de fechas |
| GET | `/statistics/by-po` | Estadísticas agrupadas por PO |
| GET | `/statistics/by-month?year=YYYY&month=MM` | Estadísticas por mes específico |

### Ejemplo de Request (Crear)

```bash
POST /api/requirement-returns
Content-Type: application/json

{
  "po_name": "Juan David Jimenez",
  "task_code": "TASK-456",
  "return_reason": "El requerimiento necesita más claridad en los criterios de aceptación"
}
```

### Respuesta Exitosa

```json
{
  "success": true,
  "id": 1,
  "message": "Devolución registrada exitosamente"
}
```

---

## Archivos Creados/Modificados

### Backend
- ✅ `backend/migrations/create_requirement_returns_table.sql` - Migración de BD
- ✅ `backend/src/models/requirementReturn.model.ts` - Modelo de datos
- ✅ `backend/src/controllers/requirementReturn.controller.ts` - Lógica de negocio
- ✅ `backend/src/routes/requirementReturn.routes.ts` - Definición de rutas
- 🔄 `backend/src/app.ts` - Importación y registro de rutas

### Frontend
- ✅ `frontend/src/app/core/requirement-return.service.ts` - Servicio HTTP
- ✅ `frontend/src/app/pages/requirement-returns/requirement-returns.component.ts` - Componente TypeScript
- ✅ `frontend/src/app/pages/requirement-returns/requirement-returns.component.html` - Template HTML
- ✅ `frontend/src/app/pages/requirement-returns/requirement-returns.component.scss` - Estilos
- 🔄 `frontend/src/app/app.module.ts` - Declaración de componente
- 🔄 `frontend/src/app/app-routing.module.ts` - Ruta de navegación
- 🔄 `frontend/src/app/app.component.html` - Enlace en sidebar

---

## Cómo Iniciar

### 1. Backend
```powershell
cd backend
npm run dev
```

La migración SQL se ejecutará automáticamente al iniciar. La tabla `requirement_returns` se creará si no existe.

### 2. Frontend
```powershell
cd frontend
npm start
```

### 3. Acceder
- Abre `http://localhost:4200`
- Inicia sesión
- Haz clic en **"📋 Devoluciones"** en el sidebar

---

## Validaciones

✅ Todos los campos son requeridos para crear una devolución:
- PO: Selección obligatoria
- Código de tarea: No puede estar vacío
- Motivo: Descripción obligatoria

✅ Las fechas se generan automáticamente del servidor

✅ Los filtros son opcionales pero optimizan la búsqueda

---

## Estadísticas Disponibles

El módulo permite consultar:

1. **Por PO:** ¿Cuántas devoluciones ha tenido cada PO?
2. **Por Mes:** ¿Cuántas devoluciones hubo en Enero, Febrero, etc.?
3. **Por PO y Mes:** ¿Cuántas devoluciones tuvo Juan David en Marzo?
4. **Promedios:** ¿Cuál es el promedio de devoluciones por PO?

---

## Notas de Desarrollo

- **Soft Delete:** Las devoluciones eliminadas se marcan como `is_active = 0`, no se borran de BD
- **Índices:** Se crearon índices para optimizar búsquedas por `po_name`, `task_code` y `created_at`
- **Timestamps:** La fecha `created_at` es automática (servidor MySQL)
- **Seguridad:** Requiere autenticación via JWT (AuthGuard)

---

## Próximas Mejoras Sugeridas

- 📊 Gráficos de tendencia de devoluciones por mes
- 📧 Notificaciones a POs cuando se registra una devolución
- 🔄 Integración con sistema de tickets (Jira, Azure DevOps)
- 📝 Historial de cambios en devoluciones
- 🎯 Metas y objetivos de devoluciones por PO

---

**Última actualización:** 10 de diciembre de 2025
**Módulo:** Devoluciones de Análisis de Requerimientos
**Estado:** ✅ Completamente implementado y funcional
