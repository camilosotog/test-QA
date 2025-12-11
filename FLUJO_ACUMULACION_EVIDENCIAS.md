# 📦 Mejora: Acumulación de Evidencias - Nuevo Flujo

## ✨ Cambio Principal

**Antes:** Cada vez que seleccionabas archivos, se reemplazaban los anteriores
**Ahora:** Los archivos se **acumulan** en una lista visual hasta que presionas "Guardar Resultado"

---

## 🎯 Nuevo Flujo de Uso

### Paso 1: Seleccionar Archivos (Múltiples Veces)

```
1. Abre un caso
2. Presiona "Seleccionar Archivos"
3. Elige: screenshot1.png
4. Los archivos aparecen en azul con etiqueta "Archivos a subir: 1"
   ┌─────────────────────────────────────────┐
   │ 📄 Archivos a subir: 1                  │
   ├─────────────────────────────────────────┤
   │ 📝 screenshot1.png (245 KB)      [✕]   │
   └─────────────────────────────────────────┘
```

### Paso 2: Agregar Más Archivos (SIN PERDER LOS ANTERIORES)

```
5. Presiona "Seleccionar Archivos" DE NUEVO
6. Elige: screenshot2.png, log.txt
7. Ahora ve 3 archivos en la lista
   ┌──────────────────────────────────────────┐
   │ 📄 Archivos a subir: 3                   │
   ├──────────────────────────────────────────┤
   │ 📝 screenshot1.png (245 KB)       [✕]   │
   │ 📝 screenshot2.png (512 KB)       [✕]   │
   │ 📝 log.txt (15 KB)                [✕]   │
   └──────────────────────────────────────────┘
```

### Paso 3: Eliminar Archivos Individuales (Opcional)

```
8. Si seleccionaste por error, presiona [✕] en el archivo
9. Se remueve solo ese archivo
   ┌──────────────────────────────────────────┐
   │ 📄 Archivos a subir: 2                   │
   ├──────────────────────────────────────────┤
   │ 📝 screenshot1.png (245 KB)       [✕]   │
   │ 📝 log.txt (15 KB)                [✕]   │
   └──────────────────────────────────────────┘
```

### Paso 4: Guardar TODO de Una Sola Vez

```
10. Completa los campos (estado, notas, QA, etc.)
11. Presiona "Guardar Resultado"
12. Backend:
    - Sube TODOS los archivos a S3
    - Combina con evidencias anteriores (si las hay)
    - Guarda array completo en BD
13. Frontend:
    - Recarga la ejecución
    - Limpia la lista de archivos
    - Muestra TODAS las evidencias en "Evidencias guardadas"
```

### Resultado Final

```
┌──────────────────────────────────────────┐
│ ✅ Evidencias guardadas: 3               │
├──────────────────────────────────────────┤
│ ☁️ screenshot1.png (Guardado)    [Link]  │
│ ☁️ screenshot2.png (Guardado)    [Link]  │
│ ☁️ log.txt (Guardado)            [Link]  │
└──────────────────────────────────────────┘
```

---

## 🎨 Diferenciación Visual

### Archivos A Subir (Pendientes)

```
🟦 Azul + Borde Azul Izquierdo
│ 📝 screenshot1.png (245 KB)
│ • Icono azul con animación pulse
│ • Nombre en blanco
│ • Tamaño gris
```

### Archivos Guardados (Confirmados)

```
🟩 Verde + Borde Verde
│ ☁️ screenshot1.png [Link]
│ • Icono verde (check)
│ • Link clickeable en turquesa
│ • Badge "Guardado" verde
```

---

## 🔄 Gestión de Estado

| Acción | Estado | Lista |
|--------|--------|-------|
| Selecciona archivo 1 | Pendiente | [file1] |
| Selecciona archivo 2,3 | Pendiente | [file1, file2, file3] |
| Elimina archivo 2 | Pendiente | [file1, file3] |
| Guarda resultado | Se sube a S3 | [] (limpia) |
| Recarga caso | Muestra guardados | [evidencia1, evidencia2, evidencia3] |
| Selecciona nuevo archivo | Pendiente | [newFile] |
| Guarda de nuevo | Acumula | [] (limpia) |

---

## 📊 Ejemplo Completo

### Iteración 1:

```
1. Caso: "Validar login"
2. Sube: screenshot-error.png
3. Guarda
4. Resultado: 1 evidencia guardada ✅
```

### Iteración 2 (Mismo caso, más evidencias):

```
1. Vuelve al caso "Validar login"
2. Ve: 1 evidencia guardada (screenshot-error.png)
3. Selecciona: log.txt, trace.log
4. Ahora ve:
   - Archivos a subir: 2 (log.txt, trace.log) 🟦
   - Evidencias guardadas: 1 (screenshot-error.png) 🟩
5. Guarda
6. Resultado: 3 evidencias guardadas ✅
```

---

## 💡 Cambios Técnicos

### Frontend - `onEvidenceSelected()`
```typescript
// Antes: Reemplazaba
this.evidenceFiles = [];

// Ahora: Acumula
for (let i = 0; i < files.length; i++) {
  this.evidenceFiles.push(files[i]);
}
```

### Frontend - `loadCaseResult()`
```typescript
// Antes: Limpiaba al cambiar de caso
this.evidenceFiles = [];

// Ahora: Mantiene los archivos seleccionados
// (Solo se limpian cuando se guarda exitosamente)
```

### Frontend - `formatFileSize()`
```typescript
// Nuevo: Formatea tamaño de archivo
245 Bytes → "245 Bytes"
1024 Bytes → "1 KB"
1024000 Bytes → "1000 KB"
```

### HTML - Mejoras Visuales
```html
<!-- Antes -->
<h6>Archivos seleccionados:</h6>

<!-- Ahora -->
<h6>
  <i class="bi bi-plus-circle-fill text-primary"></i> 
  Archivos a subir: {{ evidenceFiles.length }}
</h6>
```

### CSS - Nuevos Estilos
```scss
.evidence-item.pending {
  background: rgba(13, 110, 253, 0.1);
  border-left: 3px solid #0d6efd;
  
  i {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## ✅ Beneficios

1. **Menos clics** - Selecciona múltiples veces sin perder anteriores
2. **Mejor UX** - Ve todos los archivos antes de guardar
3. **Control** - Puede eliminar archivos individuales
4. **Claridad visual** - Diferencia archivos pendientes de guardados
5. **Seguridad** - Todo se sube en una sola operación

---

## 🚀 Cómo Usar

```
1. Selecciona archivos → Aparecen en azul
2. Selecciona más → Se agregan a la lista
3. (Opcional) Elimina alguno con [✕]
4. Completa los campos del formulario
5. Presiona "Guardar Resultado" → TODO se sube junto
6. Listo ✅
```

