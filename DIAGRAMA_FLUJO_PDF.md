# 📈 Diagrama de Flujo - Incrustación de Imágenes en PDF

## Flujo Principal: exportToPDF()

```
┌─────────────────────────────────────────────────────────────────┐
│  USUARIO: Click en "Exportar a PDF"                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Validación: ¿Existe execution?                               │
│    └─ NO: Error "No hay ejecución para exportar"                │
│    └─ SI: Continuar                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  📦 Importar pdfMake dinámicamente                               │
│    ├─ pdfMake (librería)                                        │
│    └─ pdfFonts (fuentes)                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  📷 Escanear evidencias de todos los test cases                  │
│    └─ Crear lista: imagesToLoad[]                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴──────────────┐
         │ Para cada test case:     │
         │  1. getSavedEvidenceURLs │
         │  2. extractFileName      │
         │  3. Clasificar:          │
         │     ✓ Imagen → Cargar    │
         │     ✓ Video → Saltear    │
         └───────────┬──────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ DESCARGAS EN PARALELO (Batches de 5)                         │
│                                                                  │
│  ┌─ Batch 1 (Imágenes 1-5):                                    │
│  │  ├─ fetch(url) → Blob                                       │
│  │  ├─ FileReader → Base64                                     │
│  │  ├─ Validar: length > 20                                    │
│  │  └─ Guardar en imageCache[url] = base64                    │
│  │                                                              │
│  ├─ Batch 2 (Imágenes 6-10):                                   │
│  │  └─ (Mismo proceso)                                          │
│  │                                                              │
│  └─ Batch N:                                                    │
│     └─ (Mismo proceso)                                          │
│                                                                  │
│  Errores → Reintentar 3 veces → Si falla: fallCount++          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  📊 Mostrar Resumen en Consola:                                 │
│    ✅ Imágenes incrustadas: X                                   │
│    ❌ Imágenes fallidas: Y                                      │
│    📹 Videos (solo URL): Z                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  🏗️ Construir PDF: buildPDFContent(imageCache)                  │
│    └─ Recorrer cada test case:                                 │
│       ├─ Título del caso                                        │
│       ├─ Estado (Pasó/Falló/Bloqueado/Saltado)                 │
│       ├─ Detalles (duración, paso, resultado)                  │
│       └─ EVIDENCIAS:                                             │
│          ├─ ¿Image en cache? → { image: base64 }  ✅ VISUAL    │
│          ├─ ¿Image NO en cache? → { text: url }   ❌ ENLACE   │
│          └─ ¿Video? → { text: 🎥, link: url }    📹 ENLACE   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  📄 Generar y Descargar PDF                                      │
│    └─ pdfMake.createPdf().download()                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ PDF descargado a: Ejecucion_SUITE_FECHA.pdf                 │
│                                                                  │
│  Archivo en carpeta de descargas del navegador                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Descarga de Imagen: urlToBase64()

```
┌──────────────────────────────────┐
│  URL de imagen (S3)              │
│  https://qa-oncredit.s3.../...   │
└─────────────┬────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Intento 1 de 3      │
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ fetch(url, {               │
    │   mode: 'cors',            │
    │   headers: {...}           │
    │ })                         │
    └─────────┬───────────────────┘
              │
         ┌────┴────┐
         │ ¿OK?    │
         └─┬──┬────┘
      SÍ  │  │  NO
        ┌──▼──▼─────────────────┐
        │ Reintentar (+1 intento)│
        │ Esperar 1 segundo      │
        │ goto INTENTO 2         │
        └───────────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ Convertir respuesta a Blob  │
    │ response.blob()             │
    └─────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ Validar Blob:              │
    │ ✓ exists                   │
    │ ✓ size > 0                 │
    └─────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ FileReader.readAsDataURL()  │
    │ (convierte a Base64)        │
    └─────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ Validar Base64:            │
    │ ✓ Comienza con "data:"     │
    │ ✓ length > 20              │
    └─────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ "data:image/png;base64,..." │
    │ ÉXITO ✅                    │
    └─────────────────────────────┘
```

**Si algún paso falla**:
```
ERROR ❌
  │
  ├─ ¿Reintentos < 3?
  │  └─ SI: Volver a intentar (ir a paso 1)
  │  └─ NO: Retornar vacío ""
  │
  └─ buildPDFContent() verá que está vacío
     └─ Usará URL como enlace en lugar de imagen
```

---

## Flujo de Clasificación: Imagen vs Video

```
┌─────────────────────────────────────────┐
│  URL: https://s3.../file.EXTENSIÓN      │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌─────────────────┐
         │ Extraer nombre  │
         │ file.EXTENSIÓN  │
         └────────┬────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────────┐  ┌──────────────────────┐
│ Extensión es:    │  │ Extensión es:        │
│ jpg/jpeg/        │  │ mp4/webm/            │
│ png/gif/webp     │  │ mov/avi              │
│                  │  │                      │
│  IMAGEN 📷       │  │  VIDEO 🎥            │
└────────┬─────────┘  └──────────┬───────────┘
         │                        │
         ▼                        ▼
    ┌─────────────┐          ┌──────────────┐
    │ Descargar   │          │ SALTAR       │
    │ → Base64    │          │ Mantener URL │
    │ → Cache     │          │ Solo enlace  │
    └─────────────┘          └──────────────┘
```

---

## Flujo de Precarga Paralela

```
Lista: [Img1, Img2, Img3, Img4, Img5, Img6, Img7, Img8, Img9, Img10]
Límite paralelo: 5

┌────────────────────────────────────────────┐
│  BATCH 1 (Paralelo 0-1ms)                  │
├────────────────────────────────────────────┤
│  Task 1: Img1.fetch() ──────┐              │
│  Task 2: Img2.fetch() ──────┤              │
│  Task 3: Img3.fetch() ──────┤              │
│  Task 4: Img4.fetch() ──────┼─→ ESPERAR   │
│  Task 5: Img5.fetch() ──────┤  1000ms     │
│                             │  (esperando)│
│  Promise.all([T1,T2,T3,T4,T5]) ◄──┘       │
└────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ BATCH 1 COMPLETO ✅   │
        │ Guardar:              │
        │ - Img1 en cache       │
        │ - Img2 en cache       │
        │ - Img3 en cache       │
        │ - Img4 en cache       │
        │ - Img5 en cache       │
        └───────────┬───────────┘
                    │
┌───────────────────▼───────────────────────┐
│  BATCH 2 (Paralelo 1000-2000ms)           │
├───────────────────────────────────────────┤
│  Task 6: Img6.fetch() ──────┐             │
│  Task 7: Img7.fetch() ──────┤             │
│  Task 8: Img8.fetch() ──────┤             │
│  Task 9: Img9.fetch() ──────┼─→ ESPERAR  │
│  Task 10: Img10.fetch() ────┤  1000ms    │
│                             │ (esperando)│
│  Promise.all([T6,T7,T8,T9,T10]) ◄──┘     │
└───────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ BATCH 2 COMPLETO ✅   │
        │ Guardar:              │
        │ - Img6 en cache       │
        │ - Img7 en cache       │
        │ - Img8 en cache       │
        │ - Img9 en cache       │
        │ - Img10 en cache      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ TOTAL: 2000ms         │
        │ (vs 10000ms secuencial)
        └───────────────────────┘
```

---

## Flujo de Construcción del PDF

```
buildPDFContent(imageCache)
     │
     ├─ Título: "📊 Reporte de Ejecución"
     │
     ├─ Información General:
     │  ├─ Suite Name
     │  ├─ Environment
     │  ├─ Total Cases
     │  └─ Timestamps
     │
     ├─ Para CADA test case:
     │  │
     │  ├─ Título del caso
     │  ├─ Estado
     │  ├─ Duration
     │  ├─ Step
     │  ├─ Expected Result
     │  │
     │  └─ EVIDENCIAS:
     │     │
     │     ├─ Para CADA evidencia:
     │     │  │
     │     │  ├─ ¿Es imagen?
     │     │  │  │
     │     │  │  ├─ ¿Está en cache?
     │     │  │  │  ├─ SÍ: { image: base64 } ✅ VISUAL
     │     │  │  │  └─ NO: { text: url } ❌ ENLACE
     │     │  │  │
     │     │  │  └─ Insertar con:
     │     │  │     ├─ width: 120px
     │     │  │     ├─ height: auto
     │     │  │     └─ fit: [120, 120]
     │     │  │
     │     │  └─ ¿Es video?
     │     │     └─ { text: "🎥 video.mp4", link: url } 📹 ENLACE
     │     │
     │     └─ Siguiente evidencia
     │
     ├─ Página de resumen:
     │  ├─ Total: Pasaron X, Fallaron Y
     │  ├─ Gráfica de resultados
     │  └─ Detalles
     │
     └─ RETURN: Array de contenido

          │
          ▼
     pdfMake.createPdf(
       {
         content: [...],
         styles: {...}
       }
     ).download("Ejecucion_...pdf")
```

---

## Ciclo de Vida Completo (Timeline)

```
T=0ms    Usuario: Click "Exportar a PDF"
         ├─ exportToPDF() inicia
         └─ Validar execution

T=10ms   Importar pdfMake dinámicamente
         ├─ pdfMake: OK
         └─ pdfFonts: OK

T=20ms   Escanear test cases
         ├─ Encontrar 20 imágenes
         ├─ Encontrar 3 videos
         └─ Crear lista imagesToLoad[]

T=30ms   Iniciar descargas paralelas
         └─ BATCH 1: Img1-5 en paralelo

T=1000ms BATCH 1 completo ✅
         ├─ 5 imágenes en cache
         └─ Iniciar BATCH 2: Img6-10

T=2000ms BATCH 2 completo ✅
         ├─ 5 imágenes en cache
         └─ Iniciar BATCH 3: Img11-15

T=3000ms BATCH 3 completo ✅
         ├─ 5 imágenes en cache
         └─ Iniciar BATCH 4: Img16-20

T=4000ms BATCH 4 completo ✅
         ├─ 20 imágenes en cache
         └─ Mostrar resumen en consola

T=4500ms Construir PDF
         ├─ buildPDFContent(imageCache)
         ├─ Insertar 20 imágenes visibles
         ├─ Insertar 3 videos como enlaces
         └─ Resultado: Contenido completo

T=5000ms Generar PDF
         ├─ pdfMake.createPdf()
         ├─ Comprimir
         └─ Download

T=5500ms ✅ PDF DESCARGADO
         └─ Archivo: Ejecucion_SUITE_FECHA.pdf
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                   EXPORTAR A PDF                        │
│                                                         │
│  1️⃣  Escanear evidencias                               │
│  ├─ 20 imágenes (jpg, png, gif, webp)                 │
│  └─ 3 videos (mp4, mov, avi)                           │
│                                                         │
│  2️⃣  Descargar imágenes EN PARALELO (5 a la vez)      │
│  ├─ Batch 1: Img 1-5 (1 seg)                          │
│  ├─ Batch 2: Img 6-10 (1 seg)                         │
│  ├─ Batch 3: Img 11-15 (1 seg)                        │
│  └─ Batch 4: Img 16-20 (1 seg)                        │
│     = 4 segundos total ⚡                               │
│                                                         │
│  3️⃣  Convertir a Base64                               │
│  ├─ Fetch: https://... → Blob                         │
│  ├─ FileReader: Blob → data:image/png;base64,...      │
│  └─ Validar y guardar en Map                          │
│                                                         │
│  4️⃣  Construir PDF                                    │
│  ├─ Para cada imagen:                                 │
│  │  └─ { image: base64, width: 120 }                 │
│  │     ↑                                               │
│  │     Aparecerá VISIBLE en el PDF ✅                  │
│  │                                                     │
│  └─ Para cada video:                                  │
│     └─ { text: "🎥 video.mp4", link: url }            │
│        ↑                                               │
│        Aparecerá como ENLACE en el PDF ❌              │
│                                                         │
│  5️⃣  Descargar PDF                                    │
│  └─ Ejecucion_LoginTest_03-12-2024.pdf               │
│                                                         │
│  📊 RESUMEN:                                           │
│  ✅ Imágenes incrustadas: 20                           │
│  ❌ Imágenes fallidas: 0                               │
│  📹 Videos: 3 (solo URLs)                              │
│                                                         │
│  ⏱️  Tiempo total: 5.5 segundos                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Conclusión

El flujo implementado asegura que:

✅ **Imágenes**: Se descargan, convierten a Base64, y aparecen **VISIBLES** en el PDF
✅ **Videos**: Se identifican, NO se descargan, y aparecen solo como **ENLACES**
✅ **Performance**: Descargas paralelas hacen que sea **5x más rápido**
✅ **Robustez**: Reintentos automáticos y manejo de errores
✅ **Logging**: Detallado para debugging

