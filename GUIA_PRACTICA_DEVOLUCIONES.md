# 📋 Guía Práctica: Devoluciones de Análisis de Requerimientos

## Casos de Uso Reales

### Caso 1: Registrar Devolución de Juan David Jimenez

**Escenario:** El equipo de QA revisa el requerimiento TASK-123 y encuentra que los criterios de aceptación son ambiguos.

**Pasos:**
1. Click en "➕ Nueva Devolución"
2. PO: Selecciona "Juan David Jimenez"
3. Código de tarea: Escribe "TASK-123"
4. Motivo: "Criterios de aceptación poco claros. Se requiere especificar el comportamiento esperado en la validación del campo email."
5. Click en "➕ Registrar"
6. ✅ Devolución registrada automáticamente con fecha: 10/12/2025 14:35

---

### Caso 2: Analizar Devoluciones de Diciembre por PO

**Escenario:** El manager de QA quiere saber cuántas devoluciones tuvo cada PO en diciembre.

**Pasos:**
1. Click en "📊 Estadísticas"
2. Selecciona el mes "Diciembre"
3. El sistema muestra:
   - Juan David Jimenez: 5 devoluciones
   - Alejandro Suarez: 3 devoluciones
   - Sebastian Chaves: 7 devoluciones
   - Jonnat Torres: 2 devoluciones
   - Adalberto Salas: 1 devolución
4. **Total:** 18 devoluciones
5. **Promedio:** 3.6 devoluciones por PO

---

### Caso 3: Buscar Devoluciones de un Código Específico

**Escenario:** Necesitas encontrar todas las devoluciones asociadas a "REQ-001"

**Pasos:**
1. Click en "📝 Listado"
2. En "Filtrar por código de tarea..." escribe "REQ-001"
3. Click en "🔍 Filtrar"
4. Se muestran todas las devoluciones de ese código
5. Puedes editar o eliminar cualquiera si es necesario

---

### Caso 4: Editar Devolución Anterior

**Escenario:** Registraste una devolución pero necesitas actualizar el motivo.

**Pasos:**
1. Click en "📝 Listado"
2. Busca la devolución en la tabla
3. Click en "✏️ Editar"
4. Modifica el motivo (o cualquier otro campo)
5. Click en "✏️ Actualizar"
6. ✅ Cambios guardados

---

### Caso 5: Reporte Mensual Completo

**Escenario:** Necesitas un reporte de devoluciones de noviembre por PO.

**Pasos:**
1. Click en "📊 Estadísticas"
2. Selecciona "Noviembre"
3. Se muestra tabla con:
   | PO | Devoluciones | Mes |
   |---|---|---|
   | Juan David Jimenez | 4 | Noviembre/2025 |
   | Alejandro Suarez | 2 | Noviembre/2025 |
   | Sebastian Chaves | 6 | Noviembre/2025 |
   | Jonnat Torres | 1 | Noviembre/2025 |
4. **Resumen:**
   - Total: 13 devoluciones
   - POs involucrados: 4
   - Promedio: 3.25

---

## Consultas SQL Útiles (Backend)

Si necesitas hacer análisis directamente en la BD:

### Total de devoluciones por PO (todos los tiempos)
```sql
SELECT po_name, COUNT(*) as total 
FROM requirement_returns 
WHERE is_active = 1 
GROUP BY po_name 
ORDER BY total DESC;
```

### Devoluciones de un PO específico en un mes
```sql
SELECT * 
FROM requirement_returns 
WHERE po_name = 'Juan David Jimenez' 
AND YEAR(created_at) = 2025 
AND MONTH(created_at) = 12 
AND is_active = 1 
ORDER BY created_at DESC;
```

### Devoluciones por día
```sql
SELECT DATE(created_at) as fecha, COUNT(*) as total 
FROM requirement_returns 
WHERE is_active = 1 
GROUP BY DATE(created_at) 
ORDER BY fecha DESC;
```

### PO con más devoluciones
```sql
SELECT po_name, COUNT(*) as total 
FROM requirement_returns 
WHERE is_active = 1 
GROUP BY po_name 
ORDER BY total DESC 
LIMIT 1;
```

### Últimas 10 devoluciones
```sql
SELECT * 
FROM requirement_returns 
WHERE is_active = 1 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Códigos HTTP Esperados

### Operación Exitosa
```
200 OK          - Consulta exitosa
201 Created     - Devolución creada exitosamente
```

### Errores
```
400 Bad Request    - Falta algún campo requerido
404 Not Found      - Devolución no existe
500 Server Error   - Error del servidor
```

---

## Datos de Prueba (Para Testing)

### Devoluciones de Ejemplo

```json
[
  {
    "po_name": "Juan David Jimenez",
    "task_code": "TASK-001",
    "return_reason": "Falta definir los tipos de datos de entrada"
  },
  {
    "po_name": "Alejandro Suarez",
    "task_code": "REQ-042",
    "return_reason": "Los criterios de aceptación están incompletos"
  },
  {
    "po_name": "Sebastian Chaves",
    "task_code": "TASK-089",
    "return_reason": "Necesita especificar el comportamiento en casos de error"
  },
  {
    "po_name": "Jonnat Torres",
    "task_code": "REQ-015",
    "return_reason": "Las interfaces de usuario no están documentadas"
  },
  {
    "po_name": "Adalberto Salas",
    "task_code": "TASK-234",
    "return_reason": "Requiere más detalles sobre las reglas de negocio"
  }
]
```

---

## Monitoreo y Métricas

### Indicadores Clave (KPIs)

1. **Tasa de Devoluciones por PO**
   - Fórmula: Total de devoluciones / Mes
   - Meta: < 3 devoluciones por mes por PO

2. **Motivo Más Frecuente**
   - Analiza patrones en los motivos
   - Identifica áreas de mejora en definición de requerimientos

3. **Tiempo de Corrección**
   - Tracks cuánto tarda el PO en reenviar el requerimiento corregido
   - Calcula diferencia entre fecha de devolución y reingreso

---

## Troubleshooting

### ❌ Problema: No me deja registrar una devolución
**Solución:** Verifica que todos los campos estén completos:
- [ ] PO seleccionado
- [ ] Código de tarea ingresado
- [ ] Motivo de devolución escrito

### ❌ Problema: No veo el módulo en el menú
**Solución:** 
- [ ] Verifica que estés autenticado
- [ ] Recarga la página (F5)
- [ ] Limpia la caché del navegador

### ❌ Problema: Los filtros no funcionan
**Solución:**
- Haz clic en "🔍 Filtrar" después de escribir
- Si no aparece, usa "🔄 Limpiar" primero

### ❌ Problema: Las fechas no se ven correctas
**Solución:**
- Las fechas se formatean como: dd/mm/yyyy HH:MM
- La hora es la del servidor (GMT-5 para Colombia)

---

## Integración con Otros Módulos

### Relación con TestOmat
Si una tarea en TestOmat es devuelta por análisis de requerimiento:
1. Registra la devolución aquí
2. Actualiza el estado del caso en TestOmat
3. El histórico queda documentado en ambos lados

### Relación con Bugs
Si la devolución genera un bug:
1. Registra la devolución
2. Crea un bug en el módulo de Bugs con referencia a la tarea
3. Ambos registros ayudan a trackeabilidad

---

## Exportación y Reportes

### Para Excel
1. Copia la tabla de "📝 Listado"
2. Pégala en Excel
3. Formatea y crea gráficos

### Para Presentación
1. Ve a "📊 Estadísticas"
2. Toma screenshot del mes que necesites
3. Usa los KPIs para la presentación

### Por Email
Para enviar reporte mensual:
```
Asunto: Reporte Mensual - Devoluciones de Análisis de Requerimientos [MES]

Cuerpo:
Total de devoluciones: X
POs involucrados: Y
Promedio por PO: Z

[Adjunta screenshot de estadísticas]
```

---

## Mejores Prácticas

✅ **DO:**
- Registra devoluciones con motivos específicos y claros
- Usa códigos de tarea consistentes (TASK-XXX, REQ-XXX)
- Revisa estadísticas mensualmente
- Archiva devoluciones antiguas (soft delete) si no son relevantes

❌ **DON'T:**
- No dejes campos vacíos
- No uses motivos genéricos ("No funciona", "Revisar")
- No olvides actualizar si el PO corrige algo
- No crees registros duplicados

---

**Última actualización:** 10 de diciembre de 2025
