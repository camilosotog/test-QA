# Configuración para Análisis de Requerimientos MCP

## Variables de Entorno Necesarias

Agregar al archivo `.env` del backend:

```
# Jira Configuration
JIRA_API_TOKEN=tu_token_de_api_de_jira
JIRA_EMAIL=tu_email@empresa.com
JIRA_DOMAIN=https://tu-empresa.atlassian.net

# Ollama (para análisis con IA local)
# Si usas Ollama local, define host y modelo:
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2-mini  # o el modelo instalado/seleccionado
```

### Cómo obtener el token de Jira:

1. Ir a https://id.atlassian.com/manage-profile/security/api-tokens
2. Crear un nuevo token API
3. Copiar el token y guardarlo en `.env`
4. Usar el email de la cuenta Jira en `JIRA_EMAIL`

### Cómo configurar Ollama:

1. Instalar Ollama siguiendo https://ollama.ai/
2. Iniciar el servicio local según la guía de Ollama (proveerá una API en `http://localhost:11434`).
3. Actualizar `OLLAMA_HOST` y `OLLAMA_MODEL` en el archivo `.env` del backend.

## Rutas Disponibles

### 1. Analizar Historia de Usuario
```
POST /api/requirement-analysis/analyze
Content-Type: application/json

{
  "jiraUrl": "https://tu-empresa.atlassian.net/browse/PROJ-123"
}

Respuesta:
{
  "success": true,
  "data": {
    "analysis": {
      "originalHU": "...",
      "ambiguities": [...],
      "summary": {
        "totalIssues": 5,
        "criticalIssues": 2,
        "suggestions": [...]
      },
      "timestamp": "2025-12-23T..."
    },
    "pdfContent": { /* contenido para pdfMake */ }
  }
}
```

### 2. Publicar PDF en Jira
```
POST /api/requirement-analysis/publish-to-jira
Content-Type: application/json

{
  "jiraUrl": "https://tu-empresa.atlassian.net/browse/PROJ-123",
  "pdfBase64": "JVBERi0xLjQK...",
  "analysisData": { /* objeto AnalysisResult */ }
}

Respuesta:
{
  "success": true,
  "data": {
    "issueKey": "PROJ-123",
    "attachmentId": "12345",
    "message": "PDF publicado en Jira exitosamente"
  }
}
```

## Flujo de Uso en Frontend

1. Usuario ingresa URL de Jira (ej: `https://jira.empresa.com/browse/PROJ-123`)
2. Click en "Analizar"
3. Se obtienen datos de la tarea y se analizan ambigüedades
4. Se muestran resultados en tabla
5. Click en "Publicar PDF en Jira"
6. Se genera PDF con pdfMake
7. Se sube como comentario en la tarea original
8. Se descarga una copia local

## Modelo de Ambigüedades Detectadas

### Verbos Problemáticos (Genéricos):
- permitir
- gestionar
- manejar
- procesar
- optimizar
- mejorar
- facilitar
- soportar

**Solución**: Reemplazar con verbos específicos (registrar, editar, eliminar, crear, etc.)

### Adjetivos Problemáticos (Vagos):
- intuitiva
- bonito
- fácil
- rápido
- eficiente
- moderno
- simple
- elegante
- amigable
- responsive

**Solución**: Especificar con criterios medibles o guías de diseño (ej: "completar en menos de 3 clics")

## Ejemplo de Análisis

**Historia Original:**
"Como QA debo poder gestionar usuarios fácilmente en una interfaz intuitiva"

**Ambigüedades Detectadas:**
1. **Verbo "gestionar"** → Demasiado genérico
   - Sugerencia: Especificar qué acciones (crear, editar, eliminar, ver)

2. **Adjetivo "fácilmente"** → Vago
   - Sugerencia: "Completar cualquier acción en menos de 3 clics"

3. **Adjetivo "intuitiva"** → Ambiguo
   - Sugerencia: "Seguir las guías de diseño Material Design v3"

## Testing

### Con Postman:
```
POST /api/requirement-analysis/analyze
Authorization: Bearer [tu_token_jwt]
Content-Type: application/json

{
  "jiraUrl": "https://tu-empresa.atlassian.net/browse/PROJ-123"
}
```

### Con cURL:
```bash
curl -X POST http://localhost:4000/api/requirement-analysis/analyze \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{"jiraUrl":"https://tu-empresa.atlassian.net/browse/PROJ-123"}'
```
