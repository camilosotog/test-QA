# 🧪 Guía Rápida - Testing del PDF Export

## 📋 Requisitos Previos

- ✅ Servidor Angular corriendo: `http://localhost:4200`
- ✅ Backend API activo
- ✅ Base de datos con datos de prueba
- ✅ Acceso a S3 (permisos de lectura)

---

## 🚀 Pasos para Probar

### Paso 1: Navegar a una Ejecución

```
http://localhost:4200/testomat/ejecucion/[executionId]
```

Donde `[executionId]` es el ID de una ejecución existente con datos.

### Paso 2: Completar los Test Cases (Opcional)

Si no están completados:
1. Selecciona un estado (Pasó/Falló/Bloqueado/Saltado) ✅
2. Añade anotaciones en el campo de notas 📝
3. Sube evidencias (imágenes o videos) 📸

### Paso 3: Abrir la Consola del Navegador

```
F12 → Pestaña "Console"
```

### Paso 4: Hacer Clic en "Exportar a PDF"

Busca el botón en la parte inferior del formulario.

### Paso 5: Observar los Logs

Deberías ver en consola algo como esto:

```
📷 Precargando imágenes...
📦 Cargando: screenshot-1.png...
  ✅ screenshot-1.png - 156KB
📦 Cargando: screenshot-2.png...
  ✅ screenshot-2.png - 189KB
📦 Cargando: video.mp4... (saltado - no es imagen)
✅ Imágenes: 2 exitosas, 0 fallidas
✅ PDF exportado con éxito
```

### Paso 6: Revisar el PDF Descargado

El navegador debería descargar un archivo como:
```
ejecución-2025-11-18T21-45-30.pdf
```

Ábrelo y verifica:
- ✅ **Encabezado**: Información de la ejecución
- ✅ **Detalles**: Cada test case con su estado
- ✅ **Anotaciones**: Las notas añadidas
- ✅ **Imágenes**: Mostradas directamente en el PDF (120px × 120px)
- ✅ **Videos**: Como enlaces clickeables

---

## 🔍 Qué Buscar

### ✅ Si todo funciona bien:

| Elemento | Esperado |
|----------|----------|
| Imágenes | Visibles en el PDF directamente |
| Tamaño de imágenes | 120px × 120px (uniforme) |
| Videos | Como enlaces (clickeables) |
| Anotaciones | Mostradas bajo cada test |
| Estructura | Limpia y organizada |
| Consola | Sin errores (solo info/warnings) |

### ❌ Posibles Problemas

#### Problema 1: "Invalid image: File not found"
```
❌ Error en el PDF
```
**Solución:**
- Revisa la consola: ¿dice "FALLÓ"?
- Verifica que la S3 URL sea accesible públicamente
- Comprueba permisos en AWS S3

#### Problema 2: Las imágenes no aparecen en el PDF
```
❌ PDF generado pero sin imágenes
```
**Solución:**
- Abre consola (F12 → Console)
- Busca mensajes sobre imágenes
- Verifica: ¿Se cargaron las imágenes? (busca "✅" o "❌")

#### Problema 3: La conversión base64 falla
```
⚠️ Base64 inválido
```
**Solución:**
- Puede ser un problema CORS
- La imagen no es compatible
- El servidor respondió con error

#### Problema 4: El PDF tarda mucho tiempo
```
⏳ 30+ segundos esperando
```
**Solución:**
- Muchas imágenes grandes
- Conexión lenta
- Las imágenes se están comprimiendo en el proceso

---

## 🛠️ Debugging Avanzado

### Ver todos los logs en consola:

```javascript
// En la consola del navegador, copia esto:
// Esto te mostrará TODOS los logs de la app

window.localStorage.setItem('debug', '*');
location.reload();
```

### Probar la conversión base64 manualmente:

```javascript
// En la consola, prueba una imagen específica:

const url = 'https://qa-oncredit.s3.amazonaws.com/test-evidence/1763516475430-512.png';

fetch(url, {
  mode: 'cors',
  credentials: 'omit',
  headers: { 'Accept': '*/*' }
})
  .then(r => r.blob())
  .then(blob => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      console.log('✅ Base64 convertido:');
      console.log(base64.substring(0, 100) + '...');
      console.log('Tamaño:', base64.length, 'bytes');
    };
    reader.readAsDataURL(blob);
  })
  .catch(e => console.error('❌ Error:', e));
```

### Ver las imágenes precargadas:

```javascript
// Si tienes acceso al componente:
console.log('Imágenes cacheadas:', this.imageCache);
```

---

## 📊 Casos de Prueba Recomendados

### Caso 1: Test Básico
- **Descripción**: Test simple con 1 imagen
- **Expected**: PDF con imagen incrustarada
- **Tiempo**: < 5 segundos

### Caso 2: Test Completo
- **Descripción**: Test con anotaciones + 3 imágenes + 1 video
- **Expected**: PDF con imágenes y video como link
- **Tiempo**: 5-10 segundos

### Caso 3: Test Sin Evidencias
- **Descripción**: Test con anotaciones pero sin imágenes
- **Expected**: PDF con solo texto
- **Tiempo**: < 2 segundos

### Caso 4: Test con Imágenes Grandes
- **Descripción**: Test con imágenes de 2+ MB
- **Expected**: PDF generado (puede ser lento)
- **Tiempo**: 10-20 segundos

---

## 📱 Screenshots de Prueba

### Pasos Visuales:

1. **Ir a la ejecución:**
   ```
   http://localhost:4200/testomat/ejecucion/[id]
   ```

2. **Completar estados y anotaciones:**
   ```
   Pasó ✓ → Falló ✗ → Bloqueado 🔒 → Saltado ⊐
   (Nota: Los selectores coloreados deberían verse bien)
   ```

3. **Subir evidencias:**
   - Click en campo de evidencias
   - Selecciona imágenes o videos
   - Espera a que carguen

4. **Hacer scroll al footer:**
   - Busca el botón "Exportar a PDF"
   - Click

5. **Abrir consola (F12):**
   - Ve a pestaña Console
   - Observa los logs

6. **Descargar PDF:**
   - Debería aparecer en descargas

7. **Abrir PDF en navegador:**
   - Verifica que todo se vea bien

---

## ✅ Checklist Final

Marca esto como completado después de probar:

- [ ] PDF se exporta sin errores
- [ ] Imágenes aparecen en el PDF
- [ ] Tamaño de imágenes es uniforme (120px)
- [ ] Anotaciones se muestran correctamente
- [ ] Videos aparecen como enlaces
- [ ] Información general está completa
- [ ] Estados se ven con colores correctos (✓ 🔒 ✗ ⊐)
- [ ] El PDF es descargable
- [ ] No hay errores JavaScript en consola
- [ ] El nombre del archivo es correcto (ejecución-[fecha].pdf)

---

## 🎯 Resultados Esperados

### PDF Final:
```
┌─────────────────────────────────────────┐
│      REPORTE DE EJECUCIÓN DE PRUEBAS   │
├─────────────────────────────────────────┤
│  Suite: Test Suite XYZ                 │
│  Estado: ✅ COMPLETADA                  │
│  Casos: 5 (4 pasados, 1 fallido)       │
│  Éxito: 80%                            │
└─────────────────────────────────────────┘

────────────────────────────────────────────

Test 1: Login                          ✓ PASÓ
Anotaciones: Funcionó correctamente
Evidencias:
  [Imagen: 120×120px]
  [Imagen: 120×120px]

────────────────────────────────────────────

Test 2: Envío de Formulario            ✗ FALLÓ
Anotaciones: Error no mostrado
Evidencias:
  [Imagen: 120×120px]
  🎥 video.mp4 (clickeable)

────────────────────────────────────────────
```

---

## 📞 Si Hay Problemas

### Check 1: ¿Funciona la app en general?
```bash
# Terminal
npm start

# Debe mostrar:
# ✔ Compiled successfully! 
# http://localhost:4200 está disponible
```

### Check 2: ¿Hay errores de TypeScript?
```bash
# Terminal
ng build --watch

# Debe mostrar:
# ✔ Build completed successfully
```

### Check 3: ¿Se ve el botón Exportar a PDF?
- Navega a `/testomat/ejecucion/[id]`
- Scroll al footer
- Si no lo ves, abre consola: `F12 → Console`
- Busca errores

### Check 4: ¿Las imágenes están en S3?
```bash
# En consola del navegador:
fetch('https://qa-oncredit.s3.amazonaws.com/test-evidence/[imagen]')
  .then(r => r.status === 200 ? '✅ OK' : '❌ No encontrada')
  .then(console.log)
```

---

## 🎬 Video de Prueba (si necesitas referencia)

Si la app no funciona visualmente como esperado:

1. Abre DevTools (F12)
2. Console tab
3. Busca errores en rojo
4. Copia el error
5. Pega en los comentarios de este PR/Issue

---

**Versión**: 1.0
**Fecha**: 18 de noviembre de 2025
**Estado**: Listo para Testing
