# MCP: Requirement Analyzer
## Análisis Inteligente de Ambigüedades en Historias de Usuario

### 📋 Descripción General

El módulo **Requirement Analyzer** es un servidor MCP que utiliza inteligencia artificial (Claude) para detectar ambigüedades en Historias de Usuario directamente desde Jira, aplicando un esquema de análisis basado en:

- **Verbos genéricos**: Identificar acciones poco claras
- **Adjetivos vagos**: Detectar criterios subjetivos sin medición
- **Contexto inadecuado**: Señalar falta de criterios de aceptación específicos

---

## 🏗️ Arquitectura Técnica

### Stack Implementado

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Angular 17)                              │
│  ├─ RequirementAnalysisComponent                   │
│  ├─ RequirementAnalysisService                     │
│  └─ pdfMake (generación de PDF)                    │
└───────────┬─────────────────────────────────────────┘
            │ HTTP
            ↓
┌─────────────────────────────────────────────────────┐
│  BACKEND (Node.js/Express)                          │
│  ├─ requirementAnalysis.controller.ts              │
│  ├─ requirementAnalysis.routes.ts                  │
│  └─ RequirementAnalyzer (MCP)                      │
└───────────┬───────────────────────────┬─────────────┘
            │                           │
            ↓ HTTP API                  ↓ SDK
     ┌─────────────┐           ┌──────────────────┐
    │  Jira API   │           │  Ollama API (local)   │
     │ (obtener HU)│           │ (análisis IA)    │
     └─────────────┘           └──────────────────┘
```

### Flujo de Ejecución

```
1. Usuario ingresa URL de Jira
                ↓
2. Backend obtiene descripción de la tarea via Jira API
                ↓
3. RequirementAnalyzer detecta verbos genéricos y adjetivos vagos
                ↓
4. Ollama (LLM local) mejora análisis y sugiere refinamientos
                ↓
5. Genera PDF con hallazgos (pdfMake - Cliente)
                ↓
6. Sube PDF a Jira como comentario + attachment
                ↓
7. Descarga copia local del PDF
```

---

## 🔍 Algoritmo de Detección de Ambigüedades

### Verbos Problemáticos Detectados

| Verbo | Problema | Sugerencia |
|-------|----------|-----------|
| **permitir** | Demasiado genérico | "registrar", "editar", "eliminar" |
| **gestionar** | No específico | Desglosar en acciones CRUD |
| **manejar** | Vago | "procesar", "transformar", "validar" |
| **procesarOptimizar** | Vago, subjeto a medición | "Reducir tiempo a X ms" |
| **mejorar** | Subjeto a interpretación | Criterios de éxito específicos |

### Adjetivos Problemáticos Detectados

| Adjetivo | Problema | Sugerencia |
|----------|----------|-----------|
| **intuitiva** | Depende del usuario | Guías de diseño específicas (Material Design, etc.) |
| **bonito** | Subjetivo | Describir estéticamente (colores, espacios, etc.) |
| **fácil** | Relativo | "Sin más de 3 clics" |
| **rápido** | Sin unidad | "Cargar en <500ms" |
| **responsiva** | Vago | "Funciona en pantallas de 320px a 2560px" |
| **moderna** | Subjetiva | Especificar stack/patrones tecnológicos |

---

## 📝 Ejemplo de Análisis

### Historia Original (Ambigua)

```
Como QA necesito poder gestionar proyectos de forma rápida 
en una interfaz intuitiva para mejorar mi productividad.
```

### Análisis Generado

```json
{
  "originalHU": "Como QA necesito poder gestionar...",
  "ambiguities": [
    {
      "type": "verb",
      "text": "gestionar",
      "issue": "Verbo genérico y poco claro",
      "suggestion": "Reemplazar con acciones específicas: crear, editar, eliminar",
      "severity": "high",
      "lineNumber": 1
    },
    {
      "type": "adjective",
      "text": "rápida",
      "issue": "Adjetivo ambiguo sin medición",
      "suggestion": "Especificar: 'Completar cualquier acción en menos de 2 segundos'",
      "severity": "high",
      "lineNumber": 1
    },
    {
      "type": "adjective",
      "text": "intuitiva",
      "issue": "Adjetivo ambiguo - depende del usuario",
      "suggestion": "Adherirse a guías de diseño específicas [Material Design v3]",
      "severity": "high",
      "lineNumber": 1
    },
    {
      "type": "verb",
      "text": "mejorar",
      "issue": "Verbo genérico sin criterios medibles",
      "suggestion": "Especificar métrica de mejora: aumentar en X%, reducir de Y a Z",
      "severity": "medium",
      "lineNumber": 2
    }
  ],
  "summary": {
    "totalIssues": 4,
    "criticalIssues": 3,
    "suggestions": [
      "Desglosar 'gestionar' en CRUD explícito",
      "Reemplazar adjetivos subjetivos por criterios medibles",
      "Definir guías de diseño específicas",
      "Incluir métricas de performance concretas"
    ]
  }
}
```

### Historia Refinada

```
Como QA necesito poder:
- Crear nuevos proyectos de prueba
- Editar configuración de proyectos existentes
- Eliminar proyectos archivados
- Ver lista completa de proyectos

En una interfaz que:
- Cargue en menos de 2 segundos
- Permita completar cualquier acción en máximo 3 clics
- Siga Material Design v3 para facilitar aprendizaje

Para aumentar productividad de pruebas en 25%.
```

---

## 🔧 Configuración Requerida

### Variables de Entorno (.env)

```bash
# Jira API
JIRA_API_TOKEN=your_jira_api_token_here
JIRA_EMAIL=your.email@company.com
JIRA_DOMAIN=https://company.atlassian.net

# Ollama
# Configuración local de Ollama (host + modelo)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2-mini

# Opcional: S3 para almacenar PDFs generados
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=qa-oncredit
```

### Instalación de Dependencias

```bash
# Backend
cd backend
npm install axios pdfmake

Nota: Ollama se consume vía su API HTTP local; usa `OLLAMA_HOST` y `OLLAMA_MODEL` desde el backend.

# Frontend (ya incluidas)
cd frontend
npm install pdfmake
```

---

## 📡 Endpoints API

### 1. Analizar Historia de Usuario

**Endpoint**: `POST /api/requirement-analysis/analyze`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "jiraUrl": "https://company.atlassian.net/browse/PROJ-123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "analysis": {
      "originalHU": "...",
      "ambiguities": [...],
      "summary": {...},
      "timestamp": "2025-12-23T..."
    },
    "pdfContent": { /* pdfMake definition */ }
  },
  "message": "Análisis completado exitosamente"
}
```

### 2. Publicar Análisis en Jira

**Endpoint**: `POST /api/requirement-analysis/publish-to-jira`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "jiraUrl": "https://company.atlassian.net/browse/PROJ-123",
  "pdfBase64": "JVBERi0xLjQK...",
  "analysisData": { /* AnalysisResult object */ }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "issueKey": "PROJ-123",
    "attachmentId": "12345",
    "message": "PDF publicado en Jira exitosamente"
  }
}
```

---

## 🎨 Interfaz de Usuario

### Componente Principal: RequirementAnalysisComponent

**Ubicación**: `frontend/src/app/modules/requirement-analysis/`

**Características**:
- Input de URL de Jira con validación
- Botón de análisis con loading state
- Tabla de hallazgos críticos (verbos y adjetivos)
- Resumen ejecutivo (total ambigüedades, críticas)
- Botón de publicación en Jira
- Descarga de PDF local
- Notificaciones (Toast) de éxito/error

**Dependencias**:
- `RequirementAnalysisService`: Llamadas HTTP
- `pdfMake`: Generación de PDF
- Bootstrap 5: Estilos y componentes

---

## 🚀 Uso Paso a Paso

### Para Administrador de Proyecto

1. **Entrar a Análisis de Requerimientos**
   - Menu: `Análisis de Requerimientos → Detectar Ambigüedades`
   - URL: `/analisis-requerimientos`

2. **Ingresar URL de Jira**
   - Copiar URL completa: `https://jira.empresa.com/browse/PROJ-123`
   - Pegar en input
   - Click "Analizar"

3. **Revisar Resultados**
   - Ver tabla con hallazgos críticos
   - Leer sugerencias de mejora
   - Revisar resumen ejecutivo

4. **Publicar en Jira**
   - Click "Publicar PDF en Jira"
   - El PDF se sube como:
     - **Attachment**: Documento completo
     - **Comment**: Resumen ejecutivo + enlace al PDF

5. **Compartir con el Equipo**
   - Descargar copia local
   - Compartir análisis en reuniones de refinamiento

---

## 🔐 Seguridad

- **Autenticación**: Requiere JWT válido en header `Authorization`
- **CORS**: Permitido solo desde frontend autorizado
- **API Keys**: Almacenadas en variables de entorno (no en código)
- **Rate Limiting**: Implementar en producción para evitar abuso

---

## 📊 Métricas y Monitoreo

### Logs Generados

```typescript
// Cada análisis genera:
- Timestamp
- Usuario que ejecutó
- URL de Jira analizada
- Número de ambigüedades detectadas
- Tiempo de procesamiento
```

### Mejoras Futuras

- [ ] Integración con TestOmat.io para importar HU
- [ ] Histórico de análisis por proyecto
- [ ] Comparación de HU antes/después
- [ ] Templates de HU bien formadas
- [ ] Sugerencias de refactorización automática
- [ ] Análisis de cobertura (qué no está cubierto)

---

## 🧪 Testing

### Postman/Insomnia

```bash
# 1. Obtener JWT
POST http://localhost:4000/api/auth/login
{
  "email": "test@qa.com",
  "password": "password123"
}

# 2. Analizar HU
POST http://localhost:4000/api/requirement-analysis/analyze
Authorization: Bearer <JWT_TOKEN>
{
  "jiraUrl": "https://company.atlassian.net/browse/PROJ-123"
}
```

### cURL

```bash
curl -X POST http://localhost:4000/api/requirement-analysis/analyze \
  -H "Authorization: Bearer eyJ0eXAi..." \
  -H "Content-Type: application/json" \
  -d '{"jiraUrl":"https://company.atlassian.net/browse/PROJ-123"}'
```

---

## 📚 Referencias

- [Esquema de Ambigüedades](./Esquema_Ambiguedades.png)
- [API Jira Cloud](https://developer.atlassian.com/cloud/jira/rest/v3/)
- [Ollama Documentation](https://ollama.ai/)
- [pdfMake Documentation](http://pdfmake.org/)

---

**Última actualización**: 23 de diciembre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Funcional
