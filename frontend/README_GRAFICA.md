# Dashboard de Gráficas de Pruebas - Sistema Integrado

Este módulo añade una página moderna `Grafica pruebas` que consume datos de:
- Tabla `postman_results` + `postman_assertions` (Newman/Postman)
- Tabla `playwright_results` (Playwright automation)

## 🎯 8 Visualizaciones Principales (Aplicadas a TODAS las pruebas):

### **📊 Para Pruebas de Postman (Contrato y Respuesta Controlada):**

#### 1️⃣ **Métricas Globales (KPI Cards)**
- ✅ Total de pruebas ejecutadas
- 🧩 Total de aserciones (assertions)
- 💥 Total de fallas (FAIL)
- 📈 Tasa de éxito global (% PASS)
- 🕒 Última ejecución

#### 2️⃣ **Estado General** - Gráfico de Pastel 🥧
- Proporción PASS vs FAIL de aserciones
- Vista rápida de salud del sistema

#### 3️⃣ **Tendencia Temporal** - Gráfico de Líneas 📈
- Evolución de PASS y FAIL en el tiempo
- Detección de patrones post-despliegue

#### 4️⃣ **Distribución por Tipo de Aserción** - Barras Agrupadas 📊
- Comparación PASS/FAIL por assertion_name
- Identificación de validaciones problemáticas

#### 5️⃣ **Rendimiento por Ejecución** - Barras Horizontales 📊
- Porcentaje de éxito por postman_result_id
- Comparación entre ejecuciones

#### 6️⃣ **Top Errores Frecuentes** - Tabla 📋
- error_message más repetidos
- Priorización de correcciones

#### 7️⃣ **Evolución de Fallas Acumuladas** - Área Acumulada 📉
- Tendencia acumulativa de fallas
- Efectividad de correcciones

#### 8️⃣ **Distribución por Proyecto/Entorno** - Barras Apiladas 🧱
- Calidad comparativa entre tipos de aserción
- Estados por categoría

### **🤖 Para Pruebas de Playwright (Ticket Automático):**

#### 1️⃣ **Métricas Globales (KPI Cards)**
- ✅ Total de tests ejecutados
- 🧩 Tests ejecutados
- 💥 Total de fallas
- 📈 Tasa de éxito global
- 🕒 Última ejecución

#### 2️⃣ **Estado General** - Gráfico de Pastel 🥧
- Proporción Pasaron/Fallaron/Omitidos
- Vista rápida de salud de tests

#### 3️⃣ **Tendencia Temporal** - Gráfico de Líneas 📈
- Evolución de tests pasados y fallados
- Análisis de tendencias diarias

#### 4️⃣ **Distribución por Test** - Barras Agrupadas 📊
- Comparación Pasaron/Fallaron por test_name
- Identificación de tests problemáticos

#### 5️⃣ **Rendimiento por Ejecución** - Barras Horizontales 📊
- Porcentaje de éxito por fecha de ejecución
- Comparación temporal

#### 6️⃣ **Top Fallos Frecuentes** - Tabla 📋
- Tests con más fallos
- Priorización de correcciones

#### 7️⃣ **Evolución de Fallas Acumuladas** - Área Acumulada 📉
- Tendencia acumulativa de fallos
- Análisis de mejora continua

#### 8️⃣ **Distribución por Suite** - Barras Apiladas 🧱
- Comparación entre suites de tests
- Estados por suite

## Características principales:
- 📊 **8 tipos de gráficas especializadas** con Chart.js 
- 🎯 **Filtrado por proyecto** (YAMAHA, etc.)
- 🏷️ **Categorización por tipo de prueba**
- 📈 **KPIs en tiempo real**
- 🎨 **Dashboard responsive** con layout profesional

## Layout del Dashboard (MISMO PARA TODOS LOS TIPOS):
```
┌─────────────────────────────────────────────────────┐
│  🔝 KPI Cards (5 métricas principales)              │
├─────────────────┬───────────────────────────────────┤
│ 🥧 Estado Gral │ 📈 Tendencia Temporal             │
├─────────────────┼───────────────────────────────────┤
│ 📊 Distribución│ 📊 Por Ejecución                  │
├─────────────────┼───────────────────────────────────┤
│ 📋 Top Errores │ 📉 Fallas Acumuladas              │
├─────────────────┴───────────────────────────────────┤
│ 🧱 Distribución por Proyecto/Suite                 │
├─────────────────────────────────────────────────────┤
│ 📋 TABLA DETALLADA DE TODOS LOS RESULTADOS         │
│ (Específica según tipo de prueba)                  │
└─────────────────────────────────────────────────────┘
```

**✨ Interfaz Unificada:**
- ✅ Mismas gráficas para Postman (Contrato/Respuesta)
- ✅ Mismas gráficas para Playwright (Ticket Automático)
- ✅ Mismos estilos y distribución
- ✅ Experiencia consistente en todos los tipos de prueba

## 📋 **Tabla Detallada de Resultados**

Debajo de todas las gráficas se incluye una tabla detallada con todos los resultados:

### **Para Pruebas de Postman:**
- ID de resultado
- Test Name
- Aserción aplicada
- Estado (PASS/FAIL)
- HTTP Code con color coding
- Response Time con color coding
- Mensaje de error completo

### **Para Pruebas de Playwright:**
- ID de test
- Suite de prueba
- Test Name completo
- Estado (PASSED/FAILED/SKIPPED)
- Duración con color coding
- Fecha de ejecución

**Características de la tabla:**
- 📊 Color coding por estado (verde=éxito, rojo=fallo, amarillo=warning)
- 🔍 Filtros aplicados según selección
- 📥 Botón de exportación
- 📱 Diseño responsive
- ⚡ Hover effects y animaciones
- 📈 Contador de resultados mostrados

Dependencias frontend:
- ng2-charts
- chart.js

Instalación (en la carpeta frontend):

```powershell
npm install chart.js ng2-charts --save
npm install
npm run start
```

Dependencias backend:
- mysql2 (si no está instalado)

Instalación (en la carpeta backend):

```powershell
npm install mysql2
npm install
npm run dev
```

## Rutas añadidas en backend:

### Postman/Newman:
- POST /api/postman/contract-results (Body: {"projectName": "YAMAHA"})
- POST /api/postman/controlled-response-results (Body: {"projectName": "YAMAHA"})
- POST /api/postman/response-results (Body: {"projectName": "YAMAHA"})

### Playwright:
- GET /api/playwright/summary
- GET /api/playwright/daily?days=30
- GET /api/playwright/top-failures?limit=10
- GET /api/playwright/results?limit=200

Ruta frontend:
- /grafica-pruebas

## Estructura de datos:
- **Pruebas de Contrato**: Filtradas por assertion_name LIKE '%Contrato%'
- **Respuesta Controlada**: Filtradas por assertion_name LIKE '%Respuesta controlada%'
- **Ticket Automático**: Datos de Playwright

Notas:
- El sistema ahora carga **datos reales** desde la base de datos
- Los gráficos se actualizan automáticamente según el proyecto seleccionado
- Las estadísticas son calculadas en tiempo real
- Interfaz responsive y moderna con navegación por breadcrumbs
