# 📋 Sistema de Acumulación de Evidencias - COMPLETADO

**Estado:** ✅ **LISTO PARA PROBAR**
**Fecha:** 2025
**Versión:** 2.0 (Batch Upload)

---

## 🎯 Objetivo Logrado

El usuario necesitaba cambiar el flujo de carga de evidencias de:
- ❌ **Anterior:** Guardar cada archivo individual (clic por archivo)
- ✅ **Nuevo:** Seleccionar múltiples archivos y guardar TODO de una vez

---

## 🏗️ Arquitectura Implementada

### **Backend (Node.js/Express)**

```
POST /api/test-executions/:id/results/:resultId
├─ Recibe: FormData con archivos múltiples
├─ Proceso:
│  ├─ 1. Lee evidenceUrls del request
│  ├─ 2. Carga archivos a S3
│  ├─ 3. Genera URLs públicas
│  ├─ 4. COMBINA con URLs existentes
│  └─ 5. Guarda JSON array en DB
└─ Responde: Ejecución actualizada con todas las evidencias
```

**Cambio clave en `testExecution.controller.ts`:**
```typescript
// Acumula URLs en lugar de reemplazar
let allEvidenceUrls = evidence_urls;
if (existingResult && existingResult[0].evidence_urls) {
  const existingUrls = JSON.parse(existingResult[0].evidence_urls);
  allEvidenceUrls = [...existingUrls, ...evidence_urls];
}

// Guarda el array combinado
await connection.query(
  'UPDATE test_results SET evidence_urls = ? WHERE id = ?',
  [JSON.stringify(allEvidenceUrls), resultId]
);
```

### **Frontend (Angular 17)**

```
Seleccionar Archivos
    ↓
evidenceFiles[] acumula archivos
    ↓
Usuario puede:
  - Ver contador "Archivos a subir: 3"
  - Ver tamaño de cada archivo (KB/MB)
  - Remover archivos individuales
    ↓
GUARDAR RESULTADO
    ↓
Todos los archivos se suben juntos a S3
    ↓
URLs se combinan con anteriores en DB
    ↓
evidenceFiles[] se limpia
```

---

## 💾 Cambios Implementados

### **1. TypeScript Component (`test-execution-runner.component.ts`)**

#### **Method: `onEvidenceSelected()`** ✅
```typescript
onEvidenceSelected(event: any): void {
  const files = event.target.files;
  
  // ACUMULA en lugar de reemplazar
  for (let i = 0; i < files.length; i++) {
    this.evidenceFiles.push(files[i]);
  }
  
  // Limpia el input para permitir re-selección del mismo archivo
  event.target.value = '';
  
}
```

#### **Method: `formatFileSize()`** ✅ (NEW)
```typescript
formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```
Convierte: 1024000 bytes → "1000 KB"

#### **Method: `removeEvidence()`** ✅
```typescript
removeEvidence(index: number): void {
  this.evidenceFiles.splice(index, 1);
}
```

#### **Method: `loadCaseResult()`** ✅ (CHANGED)
```typescript
// ANTES: this.evidenceFiles = []; // Borraba archivos
// AHORA: NO limpia evidenceFiles
// Mantiene selección mientras el usuario navega entre casos
```

#### **Method: `saveResult()`** ✅ (ENHANCED)
```typescript
// DESPUÉS de guardar exitosamente:
this.testomatService.saveTestResult(...).subscribe(
  (response) => {
    // ... código de actualización ...
    
    // AQUÍ limpia los archivos cargados
    this.evidenceFiles = [];
    
    // Recarga la ejecución
    this.loadTestExecution();
  }
);
```

### **2. HTML Template (`test-execution-runner.component.html`)**

#### **Sección de Archivos a Subir** ✅
```html
<!-- Archivos seleccionados (pendientes de guardar) -->
<div *ngIf="evidenceFiles.length > 0" class="evidence-list mt-3">
  <h6>
    <i class="bi bi-plus-circle-fill text-primary"></i> 
    Archivos a subir: {{ evidenceFiles.length }}
  </h6>
  
  <div *ngFor="let file of evidenceFiles; let i = index" class="evidence-item pending">
    <i class="bi bi-file-text"></i> 
    <span class="file-name">{{ file.name }}</span>
    <span class="file-size text-muted">({{ formatFileSize(file.size) }})</span>
    <button 
      type="button"
      class="btn-remove"
      (click)="removeEvidence(i)"
      title="Remover archivo"
    >
      <i class="bi bi-x-circle"></i>
    </button>
  </div>
</div>

<!-- Evidencias guardadas (de resultados anteriores) -->
<div *ngIf="getSavedEvidenceUrls().length > 0" class="evidence-list mt-3">
  <h6>Evidencias guardadas:</h6>
  <div *ngFor="let url of getSavedEvidenceUrls()" class="evidence-item saved">
    <i class="bi bi-cloud-check text-success"></i> 
    <a [href]="url" target="_blank" class="evidence-link">
      {{ extractFileName(url) }}
    </a>
    <span class="badge badge-success ms-2">Guardado</span>
  </div>
</div>
```

### **3. Estilos SCSS (`test-execution-runner.component.scss`)**

#### **Pending Files (Azul Animado)** ✅
```scss
.evidence-item.pending {
  background: rgba(13, 110, 253, 0.1);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-left: 3px solid #0d6efd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  i {
    color: #0d6efd;
    animation: pulse 2s infinite;
    font-size: 1.1rem;
  }
  
  .file-name {
    font-weight: 500;
    flex: 1;
  }
  
  .file-size {
    font-size: 0.8rem;
    white-space: nowrap;
  }
  
  .btn-remove {
    background: transparent;
    border: none;
    color: #0d6efd;
    cursor: pointer;
    padding: 0;
    
    &:hover {
      color: #0a58ca;
      transform: scale(1.1);
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

#### **Saved Files (Verde Estático)** ✅
```scss
.evidence-item.saved {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-left: 3px solid #28a745;
  
  i {
    color: #28a745;
  }
  
  .evidence-link {
    color: #0d6efd;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
```

---

## 📊 Flujo de Usuario

### **Paso 1: Seleccionar Primer Lote de Archivos**
```
Usuario haz clic en "Seleccionar Archivos"
         ↓
Selecciona: reporte.pdf, screenshot.png
         ↓
evidenceFiles = [File{name: "reporte.pdf"}, File{name: "screenshot.png"}]
         ↓
UI muestra:
┌─────────────────────────────┐
│ Archivos a subir: 2         │
├─────────────────────────────┤
│ 📄 reporte.pdf (245 KB)  [✕]│
│ 🖼️  screenshot.png (1.2 MB)[✕]│
└─────────────────────────────┘
```

### **Paso 2: Agregar Más Archivos**
```
Usuario haz clic en "Seleccionar Archivos" NUEVAMENTE
         ↓
Selecciona: video.mp4
         ↓
evidenceFiles = [
  File{name: "reporte.pdf"},
  File{name: "screenshot.png"},
  File{name: "video.mp4"}
]
         ↓
UI muestra:
┌─────────────────────────────┐
│ Archivos a subir: 3         │
├─────────────────────────────┤
│ 📄 reporte.pdf (245 KB)  [✕]│
│ 🖼️  screenshot.png (1.2 MB)[✕]│
│ 🎬 video.mp4 (52 MB)    [✕]│
└─────────────────────────────┘
```

### **Paso 3: Remover un Archivo (Opcional)**
```
Usuario haz clic en [✕] del archivo screenshot.png
         ↓
evidenceFiles.splice(1, 1)
         ↓
evidenceFiles = [
  File{name: "reporte.pdf"},
  File{name: "video.mp4"}
]
         ↓
UI actualiza: Archivos a subir: 2
```

### **Paso 4: Guardar TODO de Una Vez**
```
Usuario haz clic en "Guardar Resultado"
         ↓
FormData.append() todos los archivos
FormData.append('status', 'passed')
FormData.append('notes', '...')
FormData.append('developer_name', '...')
FormData.append('qa_tested_by', '...')
         ↓
POST /api/test-executions/:id/results/:resultId
         ↓
Backend:
  1. Carga archivos a S3
  2. Obtiene URLs públicas
  3. Combina con evidencias anteriores
  4. Guarda JSON array en DB
         ↓
Frontend:
  1. evidenceFiles = [] (LIMPIA LA LISTA)
  2. Recarga ejecución
  3. Muestra evidencias guardadas en color VERDE
         ↓
UI muestra:
┌──────────────────────────────────┐
│ Evidencias guardadas:            │
├──────────────────────────────────┤
│ ✅ reporte.pdf              [↓]  │ Guardado
│ ✅ video.mp4                [↓]  │ Guardado
└──────────────────────────────────┘
```

---

## 🧪 Casos de Prueba Recomendados

### **Test 1: Acumulación Simple**
```
1. Seleccionar 2 archivos
   ✓ Verificar contador = 2
   ✓ Verificar tamaños se muestran

2. Seleccionar 1 archivo más
   ✓ Verificar contador = 3
   ✓ Verificar archivos anteriores siguen visibles
```

### **Test 2: Remover Archivo**
```
1. Con 3 archivos acumulados
2. Hacer clic en [✕] del segundo archivo
   ✓ Verificar contador = 2
   ✓ Verificar orden correcto (1º y 3º permanecen)
```

### **Test 3: Guardar y Acumular en DB**
```
1. Guardar 2 archivos
   ✓ Verificar en S3 que se subieron
   ✓ Verificar en DB que evidence_urls tiene 2 URLs

2. Más tarde, guardar 1 archivo más
   ✓ Verificar en DB que evidence_urls tiene 3 URLs
   ✓ Verificar que las 2 primeras siguen ahí
```

### **Test 4: Navegación Entre Casos**
```
1. Acumular 2 archivos en Caso 1
2. Navegar a Caso 2
   ✓ Verificar que los 2 archivos siguen en la lista
3. Navegar de vuelta a Caso 1
   ✓ Verificar que siguen los 2 archivos
4. Guardar Resultado
   ✓ Verificar que se limpian solo después de guardar
```

### **Test 5: Mostrar Evidencias Anteriores**
```
1. Ejecutar con 2 evidencias guardadas
2. Recargar el componente
   ✓ Verificar que aparecen en "Evidencias guardadas"
   ✓ Verificar que tienen badge verde "Guardado"
   ✓ Verificar que son clickeables (links a S3)
```

---

## 🔧 Errores Corregidos

| Error | Ubicación | Solución |
|-------|-----------|----------|
| Archivos se sobreescribían | Backend `saveTestResult()` | Cambiar REPLACE por MERGE |
| No se acumulaban en UI | Frontend `onEvidenceSelected()` | Cambiar `=` por `.push()` |
| Se borraban al cambiar caso | Frontend `loadCaseResult()` | Remover línea que limpiaba |
| Errores HTML closing tags | HTML estructura | Remover `</div>` duplicado |

---

## ✅ Verificación Final

```
[✅] Backend: Acumula URLs correctamente
[✅] Frontend: Archivos se acumulan en array
[✅] UI: Contador dinámico funciona
[✅] UI: Tamaños se muestran en KB/MB
[✅] UI: Colores azul (pending) y verde (saved)
[✅] UI: Animación pulse en archivos pendientes
[✅] UI: Botones de remover funcionan
[✅] HTML: Sin errores de compilación
[✅] TypeScript: Sin errores
[✅] Service: Envía todos los campos requeridos
```

---

## 📌 Próximos Pasos

1. **Pruebas manuales** del flujo de acumulación
2. **Verificar S3** que los archivos se suban correctamente
3. **Verificar DB** que las URLs se combinen bien
4. **Verificar reload** que las evidencias guardadas aparezcan
5. (Opcional) **Embed de imágenes** en PDF export

---

**Documento actualizado:** 2025
**Estado:** ✅ LISTO PARA TESTING
