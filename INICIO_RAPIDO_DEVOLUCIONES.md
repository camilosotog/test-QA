# 🚀 INICIO RÁPIDO - Módulo de Devoluciones

## ⚡ En 30 segundos

**¿Qué es?** Un módulo para registrar cuando devuelves un requerimiento a un PO porque necesita ajustes.

**¿Dónde?** `http://localhost:4200/devoluciones` (después de autenticarte)

**¿Qué necesita?**
- Nombre del PO (Juan David, Alejandro, Sebastian, Jonnat, Adalberto)
- Código de tarea (TASK-123, REQ-001)
- Por qué lo devolviste (texto libre)
- Fecha → ¡Automática! ✅

---

## 📋 3 Cosas que puedes hacer

### 1️⃣ Registrar una devolución
```
➕ Nueva Devolución 
→ Selecciona PO 
→ Escribe código tarea 
→ Escribe motivo 
→ Click Registrar ✅
```

### 2️⃣ Ver el listado
```
📝 Listado 
→ Filtrar por PO o código 
→ Ver tabla con todo 
→ Editar (✏️) o Eliminar (🗑️)
```

### 3️⃣ Analizar por mes
```
📊 Estadísticas 
→ Click en mes (Dic, Nov, Oct...) 
→ Ve cuántas devoluciones hubo 
→ Por PO + Totales + Promedio
```

---

## 🛠️ Cómo empezar

### Opción A: Desarrollo Local
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - Accede a
http://localhost:4200/devoluciones
```

### Opción B: Ya está corriendo
Solo accede a: `http://localhost:4200/devoluciones`

---

## 📊 Un ejemplo

**Escenario:** El requerimiento TASK-123 de Juan David Jimenez está poco claro.

```
1. Click "➕ Nueva Devolución"
2. PO: "Juan David Jimenez" ↓
3. Código: "TASK-123" 
4. Motivo: "Los criterios de aceptación no especifican comportamiento en errores"
5. Fecha: Automática (hoy a la hora actual) ⏰
6. Click "➕ Registrar"
7. ✅ ¡Listo! Quedar registrado para análisis
```

---

## 📈 Ver estadísticas

Al final del mes:
1. Click "📊 Estadísticas"
2. Selecciona "Diciembre"
3. Ver tabla:
   - Juan David: 5 devoluciones
   - Alejandro: 3 devoluciones
   - Sebastian: 7 devoluciones
   - Total: 15
   - Promedio: 5 por PO

---

## 🔍 Buscar devoluciones

Si necesitas encontrar una devolución anterior:
1. Click "📝 Listado"
2. Escribe en filtro de PO o código tarea
3. Click "🔍 Filtrar"
4. ¡Aparece!

---

## ✏️ Editar o Eliminar

```
En la tabla, cada fila tiene:
✏️ Editar → Modifica el registro
🗑️ Eliminar → Marca como eliminado
```

---

## 🎯 Campos Requeridos

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| PO | Select | Juan David Jimenez |
| Código Tarea | Texto | TASK-123 |
| Motivo | Texto Largo | "Requiere más claridad en..." |
| Fecha | Auto | 10/12/2025 14:35 |

---

## ❌ Si algo no funciona

### No veo el módulo en el menú
- ✅ ¿Estás logeado?
- ✅ ¿Backend corriendo en puerto 4000?
- ✅ Recarga la página (F5)

### No puedo registrar
- ✅ ¿Completaste todos los campos?
- ✅ ¿Seleccionaste un PO?
- ✅ ¿Backend respondiendo? (F12 → Network)

### Las fechas están mal
- ✅ La hora es del servidor (GMT-5)
- ✅ Verifica zona horaria en BD

---

## 📚 Documentación Completa

Para más detalles, lee:
- **MODULO_DEVOLUCIONES_README.md** - Guía completa
- **GUIA_PRACTICA_DEVOLUCIONES.md** - Ejemplos y casos
- **ARQUITECTURA_DEVOLUCIONES.md** - Cómo funciona internamente
- **IMPLEMENTACION_CHECKLIST_DEVOLUCIONES.md** - Detalles técnicos

---

## 💡 Tips Útiles

✅ **Usa códigos consistentes:** TASK-123 o REQ-001  
✅ **Motivos específicos:** "Falta validación de email" (no "revisar")  
✅ **Revisa por mes:** Ver tendencias ayuda a mejorar  
✅ **Edita si necesitas:** Cualquier campo se puede cambiar después  

---

## 🔗 Links Rápidos

| Link | URL |
|------|-----|
| Devoluciones | http://localhost:4200/devoluciones |
| Backend API | http://localhost:4000/api/requirement-returns |
| Docs | `MODULO_DEVOLUCIONES_README.md` |

---

## 🚀 ¡Ya está!

Todo está implementado y listo para usar. No necesitas instalar nada más.

Solo accede a `http://localhost:4200/devoluciones` y empieza a registrar.

---

**¿Preguntas?** Revisa los documentos de guía o el archivo `copilot-instructions.md` del proyecto.

**Última actualización:** 10 de diciembre de 2025 ✅
