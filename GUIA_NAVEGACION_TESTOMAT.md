# 🗺️ GUÍA VISUAL DE NAVEGACIÓN - TestOmat Manager

## Flujo Completo de Creación de Casos de Prueba

Ahora el sistema tiene una navegación **clara y autoexplicativa** para que no haya confusión sobre cómo crear casos de prueba.

---

## 📊 DIAGRAMA DE FLUJO

```
┌─────────────────────────────────────────────────────────────────┐
│                  DASHBOARD / SIDEBAR                             │
│  Haz clic en "TestOmat" para empezar                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │    /testomat               │
        │  PROYECTOS (Projects)      │
        │  ✓ Listar proyectos        │
        │  ✓ Crear nuevo proyecto    │
        │  ✓ Green "Suites" button   │  ← Haz clic aquí
        └────────────┬───────────────┘
                     │
        [Click en botón "Suites" o icono de carpeta verde]
                     │
                     ↓
        ┌────────────────────────────┐
        │  /testomat/suites          │
        │  SUITES del Proyecto       │
        │  ✓ Listar suites           │
        │  ✓ Crear nueva suite       │
        │  ✓ Blue "Casos" button     │  ← Haz clic aquí
        └────────────┬───────────────┘
                     │
        [Click en botón "Casos" con icono de documento]
                     │
                     ↓
        ┌────────────────────────────┐
        │  /testomat/casos           │
        │  CASOS de la Suite         │
        │  ✓ Listar casos            │
        │  ✓ Filtros: búsqueda,      │
        │    prioridad, automatización
        │  ✓ Green "Nuevo Caso" btn  │  ← Haz clic aquí
        └────────────┬───────────────┘
                     │
        [Click en botón "Nuevo Caso"]
                     │
                     ↓
        ┌────────────────────────────┐
        │  MODAL: CREAR CASO         │
        │  ✓ Nombre                  │
        │  ✓ Descripción             │
        │  ✓ Tipo (functional, etc)  │
        │  ✓ Prioridad               │
        │  ✓ Automatización          │
        │  ✓ Estado (draft, ready)   │
        │  ✓ Precondiciones          │
        │  ✓ Postcondiciones         │
        │  ✓ PASOS (FormArray)       │
        │    - Orden                 │
        │    - Descripción           │
        │    - Resultado esperado    │
        │  ✓ "+ Agregar Paso"       │
        │  ✓ "Guardar" Button        │
        └────────────────────────────┘
```

---

## 🎯 PASO A PASO VISUAL

### PASO 1: VER PROYECTOS
**Ubicación:** `/testomat`

```
┌─────────────────────────────────────────────────────┐
│  📁 Proyectos                                       │
│  Crea proyectos para organizar tus suites           │
│                              [💚 Nueva Proyecto]    │
├─────────────────────────────────────────────────────┤
│ Proyecto      | Descripción  | Estado   | Acciones │
├─────────────────────────────────────────────────────┤
│ yamaha        | QA Testing   | Activo   | 💚 Edit │  ← Suites button
│               |              |          | [Suites] │
│ sony          | Audio Tests  | Activo   | 💚 Edit │
│               |              |          | [Suites] │
└─────────────────────────────────────────────────────┘

💚 GREEN "SUITES" BUTTON = Click aquí para ver/crear suites
```

**Mejoras en esta pantalla:**
- ✅ Botón VERDE y descriptivo "Suites"
- ✅ Icono de carpeta abierta (folder icon)
- ✅ Claramente indica: haz clic para ver suites

---

### PASO 2: VER SUITES
**Ubicación:** `/testomat/suites`

```
Proyectos > [yamaha] ← Breadcrumb

┌─────────────────────────────────────────────────────┐
│  📂 Suites de yamaha                                │
│  Crea suites para organizar tus casos.              │
│  Luego, en cada suite, crea tus casos.              │
│                        [💙 Nueva Suite]             │
├─────────────────────────────────────────────────────┤
│ Suite         | Descripción  | Estado   | Acciones │
├─────────────────────────────────────────────────────┤
│ Login Testing | User auth    | Activo   | 💙 Edit │
│               |              |          | [Casos] │  ← Casos button
│ API Suite     | REST API     | Activo   | 💙 Edit │
│               |              |          | [Casos] │
└─────────────────────────────────────────────────────┘

💙 BLUE "CASOS" BUTTON = Click aquí para ver/crear casos
```

**Mejoras en esta pantalla:**
- ✅ Breadcrumb: "Proyectos > [yamaha]"
- ✅ Título claro: "Suites de {proyecto}"
- ✅ Subtítulo explicativo: paso a paso
- ✅ Botón azul "Casos" indica siguiente paso
- ✅ Alerta si no hay proyecto seleccionado

---

### PASO 3: VER CASOS
**Ubicación:** `/testomat/casos?suiteId=1`

```
Proyectos > Suites > [Login Testing] ← Breadcrumb

┌─────────────────────────────────────────────────────┐
│  ✅ Casos de Prueba                                │
│  Suite: Login Testing                               │
│  Crea casos con pasos detallados                    │
│                        [💚 Nuevo Caso]              │
├─────────────────────────────────────────────────────┤
│ FILTROS:                                            │
│ [🔍 Buscar...]  [Prioridad ▼]  [Automatización ▼]  │
│                                   [10 casos] 📊     │
├─────────────────────────────────────────────────────┤
│ Nombre         | Tipo      | Prioridad | Steps | Op │
├─────────────────────────────────────────────────────┤
│ Valid user     | Func      | 🔴 High   | 5     |👁 │  
│ login test     | Smoke     | 🟡 Med    | 3     | ✏ │
└─────────────────────────────────────────────────────┘

💚 GREEN "NUEVO CASO" BUTTON = Click para crear un caso
```

**Mejoras en esta pantalla:**
- ✅ Breadcrumb: "Proyectos > Suites > [Suite actual]"
- ✅ Título: "Casos de Prueba"
- ✅ Subtítulo: Suite actual + instrucción
- ✅ 3 Filtros en una fila
- ✅ Contador de casos
- ✅ Botón verde "Nuevo Caso" bien visible
- ✅ Alerta si no hay suite seleccionada (vuelve a suites)

---

### PASO 4: CREAR CASO (MODAL)
**Se abre al hacer clic en "Nuevo Caso"**

```
┌──────────────────────────────────────────────────────┐
│ ➕ Nuevo Caso de Prueba                    [X]      │
├──────────────────────────────────────────────────────┤
│ INFORMACIÓN BÁSICA:                                  │
│ Nombre del Caso:  [Validar login con credenciales]  │
│ Descripción:      [El usuario ingresa credenciales] │
│                                                      │
│ ATRIBUTOS:                                           │
│ Tipo: [Funcional ▼]  Prioridad: [Alta ▼]            │
│ Automatización: [Manual ▼]  Estado: [Borrador ▼]    │
│                                                      │
│ CONTEXTO:                                            │
│ Precondiciones: [El usuario está en la página...]   │
│ Postcondiciones: [El usuario ve el dashboard...]    │
│                                                      │
│ PASOS DE PRUEBA:                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1️⃣  Abrir página de login                        │ │
│ │     Resultado: Se carga correctamente             │ │
│ │     [❌ Eliminar]                                 │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 2️⃣  Ingresar usuario: admin                      │ │
│ │     Resultado: Se acepta el usuario              │ │
│ │     [❌ Eliminar]                                 │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 3️⃣  Ingresar contraseña: 12345                  │ │
│ │     Resultado: Se acepta la contraseña           │ │
│ │     [❌ Eliminar]                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ [+ Agregar Paso]  ← Haz clic para agregar más      │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Cancelar]                    [✅ Guardar Caso]     │
└──────────────────────────────────────────────────────┘
```

**Características visuales:**
- ✅ Pasos numerados (1️⃣ 2️⃣ 3️⃣)
- ✅ Campos con validación
- ✅ Botón "+ Agregar Paso" para agregar más
- ✅ Botón ❌ en cada paso para eliminar
- ✅ Modal scrolleable si hay muchos pasos
- ✅ Header y footer sticky

---

## 🎨 MEJORAS IMPLEMENTADAS

### 1. **Buttons más Descriptivos**
   - ❌ Antes: Icono de "ojo" genérico
   - ✅ Ahora: Botón de color con texto explicativo
   - Ejemplo: `[Suites]` `[Casos]` `[Nuevo Caso]`

### 2. **Breadcrumbs en cada vista**
   - ❌ Antes: No había contexto
   - ✅ Ahora: `Proyectos > Suites > Suite Actual`
   - Permite navegar hacia atrás fácilmente

### 3. **Títulos y Subtítulos claros**
   - ✅ Cada página explica qué hace
   - ✅ Texto de ayuda en cada nivel
   - ✅ Indicación del siguiente paso

### 4. **Validaciones visuales**
   - ✅ Alert si no hay proyecto seleccionado
   - ✅ Alert si no hay suite seleccionada
   - ✅ Botones deshabilitados cuando no hay contexto

### 5. **Flujo autoexplicativo**
   ```
   Ver Proyectos → Click "Suites" → Ver Suites → 
   Click "Casos" → Ver Casos → Click "Nuevo Caso" → 
   Crear Caso con Pasos
   ```

---

## 💡 RESPUESTA A TU PREGUNTA

### **¿Cómo creo un caso de prueba con suite y todo?**

1. **Abre TestOmat** desde el sidebar
2. **Haz clic en el botón VERDE "Suites"** en el proyecto
3. **Haz clic en el botón AZUL "Casos"** en la suite
4. **Haz clic en el botón VERDE "Nuevo Caso"**
5. **Llena el formulario** con:
   - Nombre del caso
   - Descripción
   - Tipo (funcional, regresión, etc)
   - Prioridad
   - Automatización
   - Pasos (haz clic "+ Agregar Paso" para agregar más)
6. **Haz clic en "Guardar Caso"**

¡Listo! El caso está creado con todos sus pasos.

---

## 🔍 ENDPOINTS API AGREGADOS

Se agregó un nuevo endpoint al backend:

```
GET /api/suites/:suiteId
```

Este endpoint obtiene los detalles de una suite específica, lo que permite al componente de casos mostrar el nombre de la suite en el breadcrumb.

---

## ✅ CHECKLIST DE NAVEGACIÓN

- [x] Botón "Suites" en proyectos (verde, descriptivo)
- [x] Breadcrumbs en cada vista
- [x] Títulos claros en cada página
- [x] Subtítulos explicativos
- [x] Alertas cuando falta contexto
- [x] Flujo autoexplicativo de proyectos → suites → casos
- [x] Pasos numerados en el formulario
- [x] Botón "+ Agregar Paso" claramente visible
- [x] Servicios actualizados con getTestSuiteById()
- [x] Sin errores de compilación

---

## 🎯 RESULTADO FINAL

Ahora cuando abras TestOmat:
1. La navegación es **clara y visual**
2. **No hay confusión** sobre dónde crear casos
3. El flujo es **autoexplicativo**
4. Cada paso está **bien señalizado**
5. Los botones son **descriptivos** (no solo iconos)

¡Tu sistema QA ahora es **mucho más amigable**! 🎉
