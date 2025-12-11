# 🔧 EJEMPLO PRÁCTICO: Cómo Funciona en Ejecución Real

## Escenario Real: Test Execution con 6 Evidencias

### Datos de Entrada

```
Test Case: Login Functionality
├─ Status: PASÓ ✓
├─ Duration: 2.5s
└─ Evidencias:
   ├─ https://qa-oncredit.s3.../evidence-1.png (200KB)
   ├─ https://qa-oncredit.s3.../evidence-2.jpg (150KB)
   ├─ https://qa-oncredit.s3.../video-1.mp4 (5MB)
   ├─ https://qa-oncredit.s3.../evidence-3.png (180KB)
   ├─ https://qa-oncredit.s3.../video-2.mov (8MB)
   └─ https://qa-oncredit.s3.../evidence-4.gif (120KB)
```

### Paso 1: Clasificación

```typescript
// El sistema escanea y clasifica:

IMÁGENES A DESCARGAR:
├─ evidence-1.png ✅
├─ evidence-2.jpg ✅
├─ evidence-3.png ✅
└─ evidence-4.gif ✅

VIDEOS A SALTEAR:
├─ video-1.mp4 (será solo URL) ⏭️
└─ video-2.mov (será solo URL) ⏭️

Resumen:
├─ Total imágenes: 4
├─ Total videos: 2
└─ Imágenes a descargar: 4
```

### Paso 2: Descargas Paralelas

```
┌──────────────────────────────────────────────────┐
│  T=0ms → T=1000ms                               │
│                                                  │
│  Descargando 4 imágenes EN PARALELO:            │
│                                                  │
│  evidence-1.png: fetch() → blob → base64        │
│  evidence-2.jpg: fetch() → blob → base64        │
│  evidence-3.png: fetch() → blob → base64        │
│  evidence-4.gif: fetch() → blob → base64        │
│                                                  │
│  (Todos SIMULTÁNEAMENTE, no uno a uno)          │
└──────────────────────────────────────────────────┘
```

**Console Output** (en tiempo real):
```
📷 Precargando imágenes para incrustación en PDF...
📦 Total de imágenes para precarga: 4

  ✅ evidence-1.png incrustado en PDF (203KB)
  ✅ evidence-2.jpg incrustado en PDF (153KB)
  ✅ evidence-3.png incrustado en PDF (183KB)
  ✅ evidence-4.gif incrustado en PDF (122KB)

📊 RESUMEN DE PRECARGA:
   ✅ Imágenes incrustadas: 4
   ❌ Imágenes fallidas: 0
   📹 Videos (solo URL): 2

🔄 Generando PDF con 4 imágenes incrustadas...
```

### Paso 3: Conversión a Base64

Para cada imagen:

```typescript
// evidence-1.png

// 1. Fetch
const response = await fetch('https://qa-oncredit.s3.../evidence-1.png');
// ↓ HTTP 200 OK

// 2. Blob
const blob = await response.blob();
// ↓ Blob { size: 203712 bytes }

// 3. FileReader
reader.readAsDataURL(blob);
// ↓ Evento: onload

// 4. Base64 String
const result = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
// ✅ Resultado final

// 5. Guardar en Map
imageCache.set(
  'https://qa-oncredit.s3.../evidence-1.png',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'
);
```

### Paso 4: Construcción del PDF

```typescript
// buildPDFContent(imageCache)

const content = [
  // Encabezado
  {
    text: '📊 Reporte de Ejecución de Pruebas',
    style: 'title'
  },
  
  // Información del test case
  {
    text: 'Test Case: Login Functionality',
    style: 'subtitle'
  },
  
  {
    text: 'Status: ✓ PASÓ | Duration: 2.5s'
  },
  
  // EVIDENCIAS
  {
    text: 'EVIDENCIAS',
    style: 'subtitle'
  },
  
  // IMAGEN 1: evidence-1.png
  {
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    width: 120,
    height: 'auto',
    fit: [120, 120]
  },
  
  // IMAGEN 2: evidence-2.jpg
  {
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
    width: 120,
    height: 'auto',
    fit: [120, 120]
  },
  
  // VIDEO 1: video-1.mp4 (NO se descarga, solo URL)
  {
    text: '🎥 video-1.mp4',
    link: 'https://qa-oncredit.s3.../video-1.mp4',
    color: '#0066cc'
  },
  
  // IMAGEN 3: evidence-3.png
  {
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    width: 120,
    height: 'auto',
    fit: [120, 120]
  },
  
  // VIDEO 2: video-2.mov (NO se descarga, solo URL)
  {
    text: '🎥 video-2.mov',
    link: 'https://qa-oncredit.s3.../video-2.mov',
    color: '#0066cc'
  },
  
  // IMAGEN 4: evidence-4.gif
  {
    image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP...',
    width: 120,
    height: 'auto',
    fit: [120, 120]
  }
];
```

### Paso 5: Generación del PDF

```typescript
pdfMake.createPdf({
  content: content,
  styles: { /* ... */ }
}).download('Ejecucion_LoginTest_03-12-2024.pdf');
```

### Resultado Final: PDF Descargado

```
═══════════════════════════════════════════════════════
       📊 REPORTE DE EJECUCIÓN DE PRUEBAS
═══════════════════════════════════════════════════════

Test Case: Login Functionality
Status: ✓ PASÓ | Duration: 2.5s

EVIDENCIAS:
─────────────────────────────────────────────────────

[Aquí aparece la imagen: evidence-1.png]     ← ✅ VISIBLE
[Mostrando screenshot del login]

[Aquí aparece la imagen: evidence-2.jpg]     ← ✅ VISIBLE
[Mostrando datos ingresados]

🎥 video-1.mp4  [Clickeable → abre URL]      ← 📹 ENLACE

[Aquí aparece la imagen: evidence-3.png]     ← ✅ VISIBLE
[Mostrando pantalla de bienvenida]

🎥 video-2.mov  [Clickeable → abre URL]      ← 📹 ENLACE

[Aquí aparece la imagen: evidence-4.gif]     ← ✅ VISIBLE
[Mostrando animación de carga]

═════════════════════════════════════════════════════
                RESUMEN DE EJECUCIÓN
═════════════════════════════════════════════════════

Imágenes incrustadas: 4 ✅
Videos (solo URLs): 2 📹

═════════════════════════════════════════════════════
```

---

## Comparación: CON vs SIN Implementación

### ❌ SIN Implementación (Antes)

```
PDF Content:
─────────────
Evidence URL: https://qa-oncredit.s3.../evidence-1.png
Evidence URL: https://qa-oncredit.s3.../evidence-2.jpg
Evidence URL: https://qa-oncredit.s3.../video-1.mp4
Evidence URL: https://qa-oncredit.s3.../evidence-3.png
Evidence URL: https://qa-oncredit.s3.../video-2.mov
Evidence URL: https://qa-oncredit.s3.../evidence-4.gif

❌ PROBLEMA: Solo URLs, no se ven las imágenes
❌ PROBLEMA: Descargas secuenciales (lento)
❌ PROBLEMA: Si falla una, falla todo
```

### ✅ CON Implementación (Después)

```
PDF Content:
─────────────
[IMAGEN VISIBLE: evidence-1.png]
[IMAGEN VISIBLE: evidence-2.jpg]
🎥 video-1.mp4 [Enlace]
[IMAGEN VISIBLE: evidence-3.png]
🎥 video-2.mov [Enlace]
[IMAGEN VISIBLE: evidence-4.gif]

✅ BENEFICIO: Imágenes se ven en el PDF
✅ BENEFICIO: Descargas en paralelo (rápido)
✅ BENEFICIO: Si falla una, continúan las otras
✅ BENEFICIO: Videos solo como enlaces (no se descargan)
```

---

## Timeline Completo de Ejecución

```
T=0ms
└─ Usuario: Click "Exportar a PDF"
   └─ Método: exportToPDF() inicia
   
T=10ms
└─ Importar librerías
   ├─ pdfMake ✓
   └─ pdfFonts ✓
   
T=20ms
└─ Escanear evidencias
   ├─ Encontrado: 4 imágenes
   └─ Encontrado: 2 videos
   
T=30ms
└─ INICIO DE DESCARGAS PARALELAS
   ├─ Task 1: Descargar evidence-1.png
   ├─ Task 2: Descargar evidence-2.jpg
   ├─ Task 3: Descargar evidence-3.png
   └─ Task 4: Descargar evidence-4.gif
   (TODOS AL MISMO TIEMPO)
   
T=1000ms
└─ TODAS LAS IMÁGENES DESCARGADAS ✓
   ├─ evidence-1.png ✓
   ├─ evidence-2.jpg ✓
   ├─ evidence-3.png ✓
   └─ evidence-4.gif ✓
   
T=1100ms
└─ Mostrar resumen en consola
   ✅ Imágenes incrustadas: 4
   ❌ Imágenes fallidas: 0
   📹 Videos (solo URL): 2
   
T=1200ms
└─ Construir PDF
   ├─ Insertar texto y tablas
   └─ Insertar imágenes base64 (4)
   └─ Insertar videos como enlaces (2)
   
T=1500ms
└─ Generar PDF
   ├─ pdfMake.createPdf()
   ├─ Comprimir contenido
   └─ Iniciar descarga
   
T=2000ms
└─ ✅ PDF COMPLETAMENTE DESCARGADO
   Archivo: Ejecucion_LoginTest_03-12-2024.pdf
   Tamaño: ~1.5 MB
   Ubicación: Carpeta de descargas del navegador
```

---

## Simulación de Error: Una Imagen Falla

```
T=30ms
└─ DESCARGAS EN PARALELO
   ├─ Task 1: evidence-1.png → ✅ OK
   ├─ Task 2: evidence-2.jpg → ❌ ERROR (HTTP 403)
   ├─ Task 3: evidence-3.png → ✅ OK
   └─ Task 4: evidence-4.gif → ✅ OK
   
T=100ms
└─ REINTENTOS AUTOMÁTICOS (3 intentos por imagen)
   ├─ Task 2 - Intento 1: evidence-2.jpg → ❌ ERROR
   │  (esperar 1 segundo)
   │
   ├─ Task 2 - Intento 2: evidence-2.jpg → ❌ ERROR
   │  (esperar 1 segundo)
   │
   └─ Task 2 - Intento 3: evidence-2.jpg → ❌ ERROR (abandonar)
   
T=1000ms
└─ CONTINUAR (no abortar)
   ├─ 3 imágenes descargadas correctamente
   └─ 1 imagen falló
   
T=1100ms
└─ Resumen
   ✅ Imágenes incrustadas: 3
   ❌ Imágenes fallidas: 1
   📹 Videos (solo URL): 2
   
T=1200ms
└─ Construir PDF
   ├─ Insertar image-1 (base64) ✓
   ├─ Insertar image-2 (como URL porque falló) ✓
   ├─ Insertar image-3 (base64) ✓
   └─ Insertar image-4 (base64) ✓
   
T=2000ms
└─ ✅ PDF DESCARGADO (aunque 1 imagen falló)
   
   Resultado: 3 imágenes visibles + 1 como URL + 2 videos como enlaces
```

### Nota Importante
Si una imagen falla, **NO se aborta todo** sino que:
1. Se intenta 3 veces (con espera de 1 segundo)
2. Si sigue fallando, se usa la URL en lugar de imagen
3. El PDF se genera igual con las imágenes que sí funcionaron
4. Muy robusto y tolerante a fallos ✅

---

## Métricas de Este Ejemplo

| Métrica | Valor |
|---------|-------|
| Imágenes en entrada | 4 |
| Videos en entrada | 2 |
| Tiempo descarga (paralelo) | ~1 segundo |
| Tiempo descarga (secuencial) | ~4 segundos |
| Mejora de velocidad | 4x ⚡ |
| Tamaño PDF final | ~1.5 MB |
| Tiempo total (inicio a descarga) | ~2 segundos |

---

## Conclusión de Este Ejemplo

```
INPUT:
- 4 imágenes (200KB + 150KB + 180KB + 120KB = 650KB)
- 2 videos (5MB + 8MB = 13MB)

PROCESO:
1. Descargar 4 imágenes (en paralelo: 1 segundo)
2. Convertir a Base64 (incluido en paso 1)
3. Guardar en memoria (Map)
4. Construir PDF (1.2 segundos)

OUTPUT:
- PDF con 4 imágenes VISIBLES
- PDF con 2 videos como ENLACES
- Tamaño final: ~1.5 MB
- Tiempo total: ~2 segundos

DIFERENCIA:
✅ SIN Implementación: Solo URLs, 6+ segundos
✅ CON Implementación: Imágenes visibles, 2 segundos
```

---

## Para Replicar Este Ejemplo

En la aplicación:
1. Ve a cualquier test execution con 4+ evidencias
2. Abre DevTools (F12)
3. Ve a Console
4. Click "Exportar a PDF"
5. Observa los logs que aparecen
6. Descarga el PDF
7. Abre en lector PDF
8. Verifica las imágenes visibles

**Esperas ver**:
```
✅ Imágenes incrustadas: 4 (o la cantidad que tengas)
📹 Videos (solo URL): 2 (o la cantidad que tengas)
```

Fin.
