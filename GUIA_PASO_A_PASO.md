# 🎯 GUÍA PASO A PASO - Probar la Implementación

## 📍 NIVEL: Principiante - Sin experiencia técnica requerida

---

## ✅ PASO 1: Preparar el Ambiente (5 minutos)

### 1.1 Abrir Terminal

**Windows:**
- Presiona `Windows + R`
- Escribe: `cmd`
- Presiona Enter

**Mac/Linux:**
- Abre Terminal (Cmd + Espacio, escribe "Terminal")

### 1.2 Navegar a la Carpeta del Proyecto

```bash
cd c:\Users\LIDER_TEC_QA\Documents\2025\Documentos\Repositorios\QA\test-qa\Manager
```

O en Mac/Linux:
```bash
cd ~/Documents/.../test-qa/Manager
```

### 1.3 Verificar que el Servidor Está Corriendo

En la terminal, ejecuta:
```bash
ng serve
```

Deberías ver algo como:
```
✔ Compiled successfully!
✔ Building...
✔ Serving at http://localhost:4200
```

Si no lo ves, significa que Angular no está instalado. **Intenta:**
```bash
npm start
```

**¿Sigue sin funcionar?** 
→ Salta al Paso 2, probablemente ya está corriendo en otra terminal

---

## ✅ PASO 2: Abrir la Aplicación (2 minutos)

### 2.1 Abrir tu Navegador Web

- Chrome, Firefox, Safari o Edge (cualquiera sirve)

### 2.2 Ir a esta dirección

Copia y pega en la barra de dirección:
```
http://localhost:4200
```

Presiona Enter

### 2.3 Deberías Ver

Una página con:
- Logo de la aplicación QA
- Menú de navegación
- O formularios si ya está autenticado

---

## ✅ PASO 3: Ver los Selectores Mejorados (3 minutos)

### 3.1 Opción A: Ver Demo Interactiva

Copia y pega esta dirección en el navegador:
```
http://localhost:4200/assets/selector-demo.html
```

Presiona Enter

### 3.2 Qué Verás

Una página con 4 selectores:
- **Pasó** - Verde con símbolo ✓
- **Falló** - Rojo con símbolo ✗
- **Bloqueado** - Amarillo con símbolo 🔒
- **Saltado** - Gris con símbolo ⊐

Intenta hacer click en cada uno para ver las animaciones.

### 3.3 Opción B: Ver en la Aplicación Real

1. Navega a: `http://localhost:4200/testomat/ejecucion/[id]`
   (Reemplaza `[id]` con un ID real de ejecución)

2. Busca los selectores en el formulario

3. Verás que están coloreados como en la demo

---

## ✅ PASO 4: Preparar un Test Case (5 minutos)

### 4.1 Ir a la Página de Ejecución

```
http://localhost:4200/testomat/ejecucion/[executionId]
```

Reemplaza `[executionId]` con un ID real.

### 4.2 Completar un Test Case

1. **Busca el primer test case** en la página
2. **Selecciona un estado:**
   - Click en el círculo verde ( ✓ ) para "Pasó"
   - O el círculo rojo ( ✗ ) para "Falló"
   - O el círculo amarillo ( 🔒 ) para "Bloqueado"
   - O el círculo gris ( ⊐ ) para "Saltado"

3. **Añade una anotación:**
   - Busca el campo "Anotaciones" o "Notas"
   - Escribe algo como: "La prueba funcionó correctamente"

4. **Sube una evidencia (Imagen):**
   - Busca un botón para subir archivo
   - Selecciona una imagen de tu computadora (PNG, JPG, etc)
   - Espera a que se cargue

### 4.3 Resultado

Deberías ver:
- ✅ Estado seleccionado (círculo coloreado)
- ✅ Anotación guardada
- ✅ Imagen subida

---

## ✅ PASO 5: Exportar a PDF (5 minutos)

### 5.1 Buscar el Botón

En la misma página de ejecución, scroll al final (bottom) de la página.

Deberías ver botones como:
- [Guardar]
- [Exportar a PDF]
- [Enviar]

### 5.2 Abrir la Consola (IMPORTANTE)

Presiona estas teclas:
```
F12
```

Si no funciona, intenta:
- **Mac:** Cmd + Option + I
- O click derecho en la página → "Inspeccionar"

### 5.3 Ver la Consola

Deberías ver una ventana en la parte inferior o lado derecho con:
- Una pestaña que dice "Console"
- Click en ella

### 5.4 Hacer Click en "Exportar a PDF"

1. Scroll de vuelta al botón si es necesario
2. **Click en "Exportar a PDF"**

### 5.5 Observar la Consola

En la ventana de consola, verás mensajes como:

```
📷 Precargando imágenes...
📦 Cargando: screenshot-1.png...
✅ screenshot-1.png - 156KB
📦 Cargando: screenshot-2.png...
✅ screenshot-2.png - 189KB
✅ Imágenes: 2 exitosas, 0 fallidas
✅ PDF exportado con éxito
```

**Esto significa que todo está funcionando correctamente.** ✅

---

## ✅ PASO 6: Descargar el PDF (3 minutos)

### 6.1 Buscar la Descarga

Después de hacer click en "Exportar a PDF", el navegador debería:

**Opción 1: Descarga automática**
- Un archivo PDF se descargará automáticamente
- Busca en tu carpeta "Descargas" o "Downloads"

**Opción 2: Mostrar donde guardarlo**
- El navegador te pregunta: "¿Dónde quieres guardar?"
- Selecciona una carpeta
- Click en "Guardar"

### 6.2 El Nombre del Archivo

El archivo se llamará algo como:
```
ejecución-2025-11-18T21-45-30.pdf
```

---

## ✅ PASO 7: Abrir y Revisar el PDF (5 minutos)

### 7.1 Abrir el PDF

1. Busca el archivo en tu carpeta de Descargas
2. Doble click para abrirlo
3. Se abrirá en tu lector de PDF predeterminado

### 7.2 Qué Deberías Ver

El PDF debe tener:

**Parte Superior:**
```
📊 Reporte de Ejecución de Pruebas

Suite: Test Suite XYZ
Estado: ✅ COMPLETADA
Ejecutada por: Juan Pérez
Fecha: 18/11/2025 14:30
Total de casos: 5
...
```

**Parte Media:**
```
1. Nombre del Test Case           ✓ PASÓ

Anotaciones:
  La prueba funcionó correctamente

Evidencias:
  [IMAGEN AQUÍ - Debe verse incrustada]
  [IMAGEN AQUÍ - Debe verse incrustada]
```

**Parte Inferior:**
```
ℹ️ Nota: Las imágenes incrustadas se muestran directamente...
Generado: 18/11/2025 21:45:30
```

### 7.3 Lo Más Importante ⭐

**Busca esto en el PDF:**

```
✅ Las imágenes DEBEN estar visibles en el PDF
   (No como enlaces, sino como imágenes reales)

✅ El tamaño de las imágenes debe ser uniforme
   (Todas deben verse del mismo tamaño)

✅ Si hay videos, deben aparecer como enlaces
   (Puedes hacer click para abrir en navegador)
```

---

## ✅ PASO 8: Validar que Todo Funciona (Checklist)

Marca cada uno que se cumpla:

### Selectores
- [ ] Los selectores tienen COLORES diferentes
- [ ] El símbolo ✓ es verde
- [ ] El símbolo ✗ es rojo
- [ ] El símbolo 🔒 es amarillo
- [ ] El símbolo ⊐ es gris

### Exportación PDF
- [ ] El PDF se descargó sin errores
- [ ] El botón "Exportar a PDF" funcionó
- [ ] La consola (F12) mostró logs de carga de imágenes

### PDF Contenido
- [ ] El PDF tiene encabezado con información
- [ ] El PDF muestra cada test case
- [ ] Las anotaciones aparecen en el PDF
- [ ] Las imágenes están INCRUSTADAS (no enlaces)
- [ ] Las imágenes tienen tamaño uniforme
- [ ] Los videos aparecen como enlaces

### Tamaño y Formato
- [ ] El PDF es descargable
- [ ] El nombre del archivo es: `ejecución-[fecha].pdf`
- [ ] El PDF se abre sin errores

**Si todos tienen ✅:**
## 🎉 ¡TODO FUNCIONA CORRECTAMENTE! 🎉

---

## ❌ Si Algo NO Funciona

### Problema 1: Los selectores NO tienen colores

**Solución:**
1. Presiona: `Ctrl + Shift + R` (en Windows)
2. O `Cmd + Shift + R` (en Mac)
3. Esto recarga la página sin caché

Si sigue sin funcionar:
→ Ver documento: `PDF_EXPORT_TESTING_GUIDE.md`
→ Sección: "Troubleshooting"

### Problema 2: El PDF no se descarga

**Solución:**
1. Abre la consola (F12)
2. Busca mensajes en rojo (errores)
3. Ve a `PDF_EXPORT_TESTING_GUIDE.md`
4. Busca el error en la sección "Problemas"

### Problema 3: Las imágenes no aparecen en el PDF

**Solución:**
1. Abre consola (F12)
2. Busca mensajes que digan "❌" o "⚠️"
3. Mira si dice algo sobre "CORS" o "No se pudo cargar"
4. Esto puede significar que:
   - La imagen no existe en S3
   - S3 no tiene permisos públicos
   - Tu conexión a internet está lenta

### Problema 4: El PDF tarda mucho en generarse

**Esto es NORMAL.** Puede tardar:
- 5-10 segundos con 1-2 imágenes
- 20+ segundos con 5-10 imágenes grandes
- Es porque está descargando y convirtiendo cada imagen

---

## 📞 Recibir Ayuda

### Si Necesitas Más Información

**Para usuarios finales:**
→ Leer: `QUICK_START.md`

**Para developers:**
→ Leer: `PDF_EXPORT_CODE_EXAMPLES.md`

**Para QA/Testing:**
→ Leer: `PDF_EXPORT_TESTING_GUIDE.md`

**Índice de todo:**
→ Leer: `INDICE_DOCUMENTACION.md`

**Por dónde empezar:**
→ Leer: `00_COMIENZA_AQUI.md`

---

## 🎓 Resumen de Pasos

```
1. Terminal corriendo ✅
   ↓
2. Navegador en localhost:4200 ✅
   ↓
3. Ver selectores mejorados ✅
   ↓
4. Completar un test case ✅
   ↓
5. Abrir consola (F12) ✅
   ↓
6. Click en "Exportar a PDF" ✅
   ↓
7. Ver logs de carga en consola ✅
   ↓
8. PDF descargado ✅
   ↓
9. Abrir PDF y verificar ✅
   ↓
10. Completar checklist ✅
   ↓
🎉 ¡ÉXITO! 🎉
```

---

## ⏱️ Tiempo Total

- Paso 1-2: 10 minutos (setup)
- Paso 3-5: 15 minutos (probar selectores)
- Paso 6-7: 10 minutos (exportar y abrir)
- Paso 8: 5 minutos (validar)

**Total: 40 minutos**

---

## 🎯 Próximo Paso

Después de completar esta guía:

1. **Usuarios:** Puedes empezar a exportar PDFs reales
2. **Developers:** Lee `PDF_EXPORT_CODE_EXAMPLES.md`
3. **QA:** Documenta tus hallazgos en `PDF_EXPORT_TESTING_GUIDE.md`
4. **Architects:** Revisa `DIAGRAMA_VISUAL_IMPLEMENTACION.md`

---

## ✅ Confirmación Final

Si completaste todos los pasos y el checklist está 100% ✅:

**La implementación está FUNCIONANDO correctamente.**

Puedes proceder con:
- ✅ Usar la funcionalidad en producción
- ✅ Capacitar al equipo
- ✅ Integrar a la rama principal
- ✅ Deploy a producción

---

**¡Felicidades por completar la validación!** 🎉

**Versión:** 1.0
**Fecha:** 18 de noviembre de 2025
**Dificultad:** Principiante (Sin experiencia técnica)
**Tiempo:** 40 minutos
**Status:** ✅ LISTO PARA USAR
