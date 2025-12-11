# 🏗️ Arquitectura - Módulo Devoluciones

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 17)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RequirementReturnsComponent                             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 3 Tabs:                                            │  │   │
│  │  │ • ➕ Nueva Devolución (formulario)                 │  │   │
│  │  │ • 📝 Listado (tabla con filtros)                  │  │   │
│  │  │ • 📊 Estadísticas (por mes y PO)                  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RequirementReturnService                               │   │
│  │  • list(filters)                                         │   │
│  │  • create(data)                                          │   │
│  │  • update(id, patch)                                     │   │
│  │  • delete(id)                                            │   │
│  │  • getStatisticsByMonth()                                │   │
│  │  • getStatisticsByPO()                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ (HTTP Requests via AuthInterceptor)
┌─────────────────────────────────────────────────────────────────┐
│                        PROXY (localhost:4200)                    │
├─────────────────────────────────────────────────────────────────┤
│  proxy.conf.json: /api/* → localhost:4000                       │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Router: /api/requirement-returns                               │
│  ├── GET  /              → listReturns                          │
│  ├── GET  /:id           → getReturnById                        │
│  ├── POST /              → createReturn                         │
│  ├── PUT  /:id           → updateReturn                         │
│  ├── DELETE /:id         → deleteReturn                         │
│  ├── GET  /date-range    → getReturnsByDateRange                │
│  ├── GET  /statistics/by-po → getStatisticsByPO               │
│  └── GET  /statistics/by-month → getStatisticsByMonth         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Controllers: requirementReturn.controller.ts            │   │
│  │  • Validación de datos                                   │   │
│  │  • Manejo de errores                                     │   │
│  │  • Respuestas JSON                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Models: requirementReturn.model.ts                      │   │
│  │  • CRUD: create, read, update, delete                    │   │
│  │  • Queries específicas por fecha, PO, mes                │   │
│  │  • Estadísticas agrupadas                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ (SQL Queries)
┌─────────────────────────────────────────────────────────────────┐
│                      MySQL Database                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Table: requirement_returns                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ id (PK)          INT AUTO_INCREMENT                        │ │
│  │ po_name          VARCHAR(255) - Juan David, Alejandro...   │ │
│  │ task_code        VARCHAR(100) - TASK-123, REQ-001         │ │
│  │ return_reason    TEXT - Motivo de devolución             │ │
│  │ created_at       TIMESTAMP DEFAULT NOW()                  │ │
│  │ is_active        TINYINT(1) DEFAULT 1 - Soft Delete       │ │
│  │                                                             │ │
│  │ Índices:                                                   │ │
│  │ • idx_po_name                                             │ │
│  │ • idx_task_code                                           │ │
│  │ • idx_created_at                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Directorios

```
Manager/
├── backend/
│   └── src/
│       ├── controllers/
│       │   └── requirementReturn.controller.ts ✨ NUEVO
│       ├── models/
│       │   └── requirementReturn.model.ts ✨ NUEVO
│       ├── routes/
│       │   └── requirementReturn.routes.ts ✨ NUEVO
│       └── app.ts 🔄 ACTUALIZADO
│   └── migrations/
│       └── create_requirement_returns_table.sql ✨ NUEVO
│
├── frontend/
│   └── src/app/
│       ├── core/
│       │   └── requirement-return.service.ts ✨ NUEVO
│       ├── pages/
│       │   └── requirement-returns/ ✨ NUEVO MÓDULO
│       │       ├── requirement-returns.component.ts
│       │       ├── requirement-returns.component.html
│       │       └── requirement-returns.component.scss
│       ├── app.module.ts 🔄 ACTUALIZADO
│       ├── app-routing.module.ts 🔄 ACTUALIZADO
│       └── app.component.html 🔄 ACTUALIZADO
```

---

## Flujo de Datos

### 1. CREATE (Registrar Devolución)

```
Usuario → Completa Formulario
    ↓
Click "➕ Registrar"
    ↓
RequirementReturnsComponent.save()
    ↓
RequirementReturnService.create(data)
    ↓
POST /api/requirement-returns
    ↓
requirementReturn.controller.createReturn(req, res)
    ↓
Validación: po_name, task_code, return_reason
    ↓
RequirementReturnModel.create()
    ↓
INSERT INTO requirement_returns VALUES (...)
    ↓
Retorna ID creado
    ↓
Response: { success: true, id: 1, message: "..." }
    ↓
Alert "Devolución registrada exitosamente"
    ↓
Resetea formulario → Navega a Listado
```

### 2. READ (Listar Devoluciones)

```
Usuario → Click "📝 Listado"
    ↓
RequirementReturnsComponent.load()
    ↓
RequirementReturnService.list(filters?)
    ↓
GET /api/requirement-returns?po_name=...&task_code=...
    ↓
requirementReturn.controller.listReturns(req, res)
    ↓
Construye WHERE con filtros
    ↓
RequirementReturnModel.list()
    ↓
SELECT * FROM requirement_returns WHERE ... ORDER BY created_at DESC
    ↓
Response: { data: [...], message: "..." }
    ↓
Renderiza tabla en HTML con *ngFor
```

### 3. UPDATE (Editar Devolución)

```
Usuario → Click "✏️ Editar" en tabla
    ↓
RequirementReturnsComponent.edit(item)
    ↓
Carga formulario con datos existentes
    ↓
Modifica campos
    ↓
Click "✏️ Actualizar"
    ↓
RequirementReturnService.update(id, patch)
    ↓
PUT /api/requirement-returns/:id
    ↓
requirementReturn.controller.updateReturn(req, res)
    ↓
Valida que hay campos para actualizar
    ↓
RequirementReturnModel.update()
    ↓
UPDATE requirement_returns SET ... WHERE id = ?
    ↓
Response: { success: true, message: "..." }
    ↓
Alert "Devolución actualizada exitosamente"
    ↓
Recarga lista
```

### 4. DELETE (Eliminar Devolución)

```
Usuario → Click "🗑️ Eliminar"
    ↓
Confirma en modal: "¿Estás seguro?"
    ↓
RequirementReturnService.delete(id)
    ↓
DELETE /api/requirement-returns/:id
    ↓
requirementReturn.controller.deleteReturn(req, res)
    ↓
RequirementReturnModel.delete()
    ↓
UPDATE requirement_returns SET is_active = 0 WHERE id = ?
    ↓
Response: { success: true, message: "..." }
    ↓
Alert "Devolución eliminada exitosamente"
    ↓
Recarga lista (la devolución no aparece más)
```

### 5. STATISTICS (Análisis por Mes)

```
Usuario → Click "📊 Estadísticas"
    ↓
Selecciona mes (click botón "Diciembre")
    ↓
RequirementReturnsComponent.selectMonth(2025, 12)
    ↓
RequirementReturnComponent.loadStatistics(year, month)
    ↓
RequirementReturnService.getStatisticsByMonth(2025, 12)
    ↓
GET /api/requirement-returns/statistics/by-month?year=2025&month=12
    ↓
requirementReturn.controller.getStatisticsByMonth(req, res)
    ↓
RequirementReturnModel.getStatisticsByMonth(2025, 12)
    ↓
SELECT po_name, COUNT(*) as total_returns, MONTH(...), YEAR(...)
FROM requirement_returns
WHERE YEAR(created_at) = 2025 AND MONTH(created_at) = 12
GROUP BY po_name, MONTH, YEAR
    ↓
Response: { data: [...], message: "..." }
    ↓
Renderiza tabla de estadísticas + resumen (total, promedio)
```

---

## Tipos de Datos

### RequirementReturn (TypeScript/Backend)

```typescript
interface RequirementReturn {
  id?: number;                  // ID único (auto-generado)
  po_name: string;              // Nombre del PO (requerido)
  task_code: string;            // Código de tarea (requerido)
  return_reason: string;        // Motivo de devolución (requerido)
  created_at?: string;          // Fecha ISO (auto-generada)
  is_active?: number;           // 1 = activo, 0 = eliminado
}
```

### Statistics (Para Análisis)

```typescript
interface RequirementReturnStatistics {
  po_name: string;        // Ej: "Juan David Jimenez"
  total_returns: number;  // Ej: 5
  month: number;          // Ej: 12
  year: number;           // Ej: 2025
}
```

---

## Validaciones

### Frontend (app-level)

```typescript
// En RequirementReturnsComponent.save()
if (!this.form.po_name || !this.form.task_code || !this.form.return_reason) {
  alert('Por favor completa todos los campos');
  return;
}
```

### Backend (server-level)

```typescript
// En requirementReturn.controller.createReturn()
if (!po_name || !task_code || !return_reason) {
  return res.status(400).json({
    success: false,
    error: 'Faltan campos requeridos: po_name, task_code, return_reason'
  });
}
```

---

## Seguridad

✅ **Autenticación:**
- Requiere login (AuthGuard en ruta `/devoluciones`)
- JWT token en header Authorization (inyectado por AuthInterceptor)

✅ **Validación:**
- Campos requeridos validados en frontend y backend
- SQL parametrizado (previene SQL injection)
- Sanitización de strings en Angular

✅ **Soft Delete:**
- No se borran registros, se marcan como `is_active = 0`
- Auditoría completa disponible en BD

---

## Rendimiento

### Índices de BD

```sql
INDEX `idx_po_name` (`po_name`)        -- Búsquedas por PO (O(log n))
INDEX `idx_task_code` (`task_code`)    -- Búsquedas por tarea (O(log n))
INDEX `idx_created_at` (`created_at`)  -- Ordenamiento por fecha (O(log n))
```

### Límites de Datos

```typescript
// Frontend: máximo 1000 registros por consulta
const limit = req.query.limit ? Number(req.query.limit) : 1000;

// Backend: pagination recomendada para > 10K registros
```

### Caché (Sugerencia)

```typescript
// En futuras mejoras
private cache = new Map();
private cacheExpiry = 5 * 60 * 1000; // 5 minutos
```

---

## Mantenimiento

### Tareas Periódicas

```sql
-- Limpiar soft-deleted antiguos (archivar)
-- Ejecutar cada 3 meses
DELETE FROM requirement_returns 
WHERE is_active = 0 
AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Análisis de queries lentos
EXPLAIN SELECT * FROM requirement_returns WHERE po_name = 'Juan David';
```

### Backups

```bash
# Backup diario de requirement_returns
mysqldump -u user -p dbname requirement_returns > backup_requirement_returns_$(date +%Y%m%d).sql
```

---

## Errores Comunes y Soluciones

| Error | Causa | Fix |
|-------|-------|-----|
| 400 Bad Request | Campos vacíos | Validar en cliente antes de enviar |
| 404 Not Found | ID no existe | Verificar ID en BD |
| 500 Server Error | Error en query SQL | Ver logs de backend |
| CORS error | Origen no permitido | Revisar app.ts CORS config |
| Fecha incorrecta | Timezone del servidor | Verificar SET @@time_zone = '+00:00' |

---

**Última actualización:** 10 de diciembre de 2025
**Arquitecto:** Sistema completo - Backend + Frontend + BD
