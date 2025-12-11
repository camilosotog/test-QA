# 🧪 Guía de Testing para Imágenes en PDF

## Verificación Rápida

### Paso 1: Abre DevTools
```
Presiona: F12 (o Ctrl+Shift+I en Windows)
Ve a: Pestaña "Console"
```

### Paso 2: Genera un PDF
```
1. En la aplicación, ve a un test execution
2. Haz click en "Exportar a PDF"
3. Observa los logs en la consola
```

### Paso 3: Busca estos logs:

**ESPERADO ✅**:
```
📷 Precargando imágenes para incrustación en PDF...
📦 Total de imágenes para precarga: 5

  ✅ screenshot-1.png incrustado en PDF (245KB)
  ✅ screenshot-2.png incrustado en PDF (189KB)
  ✅ screenshot-3.jpg incrustado en PDF (312KB)

📊 RESUMEN DE PRECARGA:
   ✅ Imágenes incrustadas: 3
   ❌ Imágenes fallidas: 0
   📹 Videos (solo URL): 2

🔄 Generando PDF con 3 imágenes incrustadas...
```

**NO ESPERADO ❌**:
```
❌ Invalid image: File 'https://...' not found in virtual file system
```

---

## Verificación en el PDF

### 1. Abre el PDF descargado

Debería verse así:

```
═══════════════════════════════════════
         TEST EXECUTION REPORT
═══════════════════════════════════════

Test Case: Login Functionality
Status: ✓ PASÓ
Duration: 2.5s

EVIDENCIAS:
┌─────────────────────────────┐
│  [IMAGEN]                   │  ✅ Imagen visible
│  Screenshot login page      │
└─────────────────────────────┘

🎥 video-recording.mp4  → [Clickeable]  ❌ Video solo URL
```

### 2. Checklist de verificación

#### Imágenes:
- [ ] Las imágenes se ven dentro del PDF (no como texto de URL)
- [ ] Las imágenes están en blanco y negro o a color (como se capturaron)
- [ ] El tamaño es consistente (~120px ancho)
- [ ] Las imágenes no están cortadas o deformadas

#### Videos:
- [ ] Aparecen como "🎥 nombrearchivo.mp4"
- [ ] El texto es un enlace clickeable (subrayado, color azul)
- [ ] Al hacer click abre la URL en S3

#### General:
- [ ] No hay errores en la consola
- [ ] El PDF se genera en menos de 10 segundos
- [ ] El tamaño del PDF es razonable (~2MB para 10 imágenes)

---

## Troubleshooting

### Problema 1: Consola muestra "❌ HTTP 403"

**Causa**: Las imágenes en S3 no son públicas

**Solución**:
1. Ve a AWS S3 Console
2. Busca el bucket: `qa-oncredit`
3. Ve a la carpeta: `test-evidence/`
4. Haz clic en una imagen
5. Verifica que tenga permisos públicos
6. Si no, añade permiso: **Everyone → Read**

**Quick test**:
```javascript
// Abre la consola y prueba:
fetch('https://qa-oncredit.s3.amazonaws.com/test-evidence/screenshot.png')
  .then(r => console.log('✅ Accesible:', r.status))
  .catch(e => console.error('❌ Error:', e))
```

---

### Problema 2: Las imágenes aparecen como URL en el PDF

**Causa**: Base64 no se generó correctamente

**Verificación**:
1. Abre DevTools (F12)
2. Durante la generación del PDF, busca:
   ```
   ✅ Imágenes incrustadas: 0
   ❌ Imágenes fallidas: 5
   ```
3. Si ves esto, las imágenes no se convirtieron a Base64

**Soluciones**:
- Recarga la página (Ctrl+R o Cmd+R)
- Limpia el caché del navegador (Ctrl+Shift+Delete)
- Prueba con una imagen pequeña primero
- Verifica la conexión de red

---

### Problema 3: El PDF tarda mucho en generarse

**Causa**: Las descargas de imágenes son lentas

**Verificación**:
1. Ve a DevTools → Network
2. Durante la generación del PDF, abre la pestaña Network
3. Verifica la velocidad de descarga de las imágenes:
   - [ ] ¿Todas descargan al mismo tiempo? (paralelo ✅)
   - [ ] ¿Una a una? (secuencial ❌)

**Optimización**:
```typescript
// En el archivo, puedes aumentar el parallelismo:
const PARALLEL_LIMIT = 10;  // Cambiar de 5 a 10
```

---

### Problema 4: Error "Cannot read property 'length' of undefined"

**Causa**: Algunas imágenes tienen un Base64 inválido

**Verificación**:
```javascript
// En la consola durante precarga:
// Busca líneas como:
// ❌ screenshot.png - Base64 inválido o vacío
```

**Solución**:
- Asegúrate que las imágenes sean válidas
- Intenta descargarlas manualmente del navegador
- Verifica que sean imágenes reales (no corrupta)

---

## Métricas Esperadas

### Performance

| Métrica | Esperado | Rango Aceptable |
|---------|----------|-----------------|
| Descargar 5 imágenes | 1-2s | < 5s |
| Descargar 10 imágenes | 2-3s | < 8s |
| Descargar 20 imágenes | 4-5s | < 15s |
| Generar PDF final | < 2s | < 5s |

### Tamaño del PDF

| Cantidad de Imágenes | Tamaño Esperado |
|----------------------|-----------------|
| 5 imágenes (512px c/u) | 0.5-1MB |
| 10 imágenes (512px c/u) | 1-2MB |
| 20 imágenes (512px c/u) | 2-4MB |
| 50 imágenes (512px c/u) | 5-10MB |

**Nota**: Los valores varían según el tipo de imagen (jpeg, png, etc.)

---

## Script de Test Completo

Copia esto en la consola:

```javascript
// Test 1: Verificar que urlToBase64 existe
console.log('Test 1: Función urlToBase64');
console.log(typeof window.app?.urlToBase64 === 'function' ? '✅ Existe' : '❌ No encontrada');

// Test 2: Verificar que el imageCache se crea
console.log('\nTest 2: ImageCache');
console.log(typeof Map === 'function' ? '✅ Map disponible' : '❌ Error');

// Test 3: Intentar descargar una imagen de ejemplo
console.log('\nTest 3: Descarga de ejemplo');
const testUrl = 'https://qa-oncredit.s3.amazonaws.com/test-evidence/test.png';
fetch(testUrl)
  .then(r => {
    if (r.ok) console.log('✅ S3 accesible');
    else console.error(`❌ HTTP ${r.status}`);
  })
  .catch(e => console.error('❌ Error CORS:', e.message));

// Test 4: Verificar que pdfMake se cargará
console.log('\nTest 4: pdfMake');
console.log('ℹ️ pdfMake se carga dinámicamente en exportToPDF()');
```

---

## Casos de Test Recomendados

### Test 1: Imagen pequeña (< 100KB)
- [ ] Descarga rápidamente
- [ ] Aparece nítida en el PDF
- [ ] No hay errores

### Test 2: Imagen grande (> 500KB)
- [ ] Se intenta descargar (puede tardar)
- [ ] Si se logra, aparece en el PDF
- [ ] Si falla, aparece como enlace

### Test 3: Video
- [ ] NO se descarga
- [ ] Aparece como enlace clickeable
- [ ] Hace click → abre URL en S3

### Test 4: Mix (5 imágenes + 2 videos)
- [ ] 5 imágenes se descargan en paralelo
- [ ] 2 videos se saltan
- [ ] PDF se genera con 5 imágenes visibles

### Test 5: Sin evidencias
- [ ] El PDF se genera sin errores
- [ ] Aparece mensaje "Sin evidencias"

---

## Logs Recomendados para Monitoring

Si añades a tu código de monitoreo:

```javascript
// Para Google Analytics o similar
gtag('event', 'pdf_generation', {
  'images_embedded': 5,
  'images_failed': 0,
  'videos_count': 2,
  'generation_time_ms': 2345
});
```

---

## Conclusión

Si todo el checklist ✅ es verde, entonces:

```
✅ Las imágenes se incrustan en el PDF
✅ Solo se usan URLs para videos
✅ El rendimiento es óptimo
✅ No hay errores
```

**¡La implementación está lista para producción! 🚀**
