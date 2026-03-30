"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToConfluence = exports.testConfluence = exports.deleteAval = exports.updateAval = exports.createAval = exports.getAvalById = exports.listAvales = exports.mejorarObservaciones = void 0;
const db_1 = require("../config/db");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ─── Helper: llamar a Ollama (local) ─────────────────────────────────────────
async function askClaude(prompt) {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    const res = await axios_1.default.post(`${ollamaUrl}/api/chat`, {
        model,
        stream: false,
        messages: [{ role: 'user', content: prompt }]
    }, { headers: { 'content-type': 'application/json' }, timeout: 120000 });
    return res.data.message.content;
}
// ─── Mejorar texto de observaciones con IA ────────────────────────────────────
const mejorarObservaciones = async (req, res) => {
    try {
        const { observations, project_name, qa_responsible, request_date, current_env, target_env, deploy_tasks } = req.body;
        const fecha = request_date
            ? new Date(request_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
        const tareas = (deploy_tasks || []).map((t) => t.jira_key).filter(Boolean);
        const tareasStr = tareas.length ? tareas.join(', ') : 'las tareas indicadas';
        const prompt = `Eres un Líder de QA con más de 10 años de experiencia redactando documentos formales de calidad en empresas de tecnología financiera.

Tu tarea es tomar las palabras clave o frase corta del analista y expandirlas en UN PÁRRAFO PROFESIONAL y bien redactado en español, coherente con el contexto de un aval de calidad para despliegue a producción.

Contexto del aval:
- Proyecto: ${project_name || 'N/A'}
- Ambiente origen: ${current_env || 'Preproducción'}
- Ambiente destino: ${target_env || 'Producción'}
- Tareas involucradas: ${tareasStr}

Palabras clave / idea del analista:
"${observations || ''}"

Reglas estrictas:
1. Genera exactamente UN párrafo fluido de 3 a 5 oraciones.
2. Expande la idea del analista con vocabulario técnico-formal de QA (validación, criterios de aceptación, cobertura de pruebas, comportamiento esperado, etc.).
3. Si las palabras clave son muy cortas (ej: "pruebas API", "sin bugs"), infiere el significado más razonable en el contexto de QA y redáctalo con profundidad profesional.
4. NO repitas literalmente las palabras clave tal cual — transf\u00f3rmalas en oraciones completas.
5. NO incluyas la declaración del aval (Yo, [nombre]...), ni fechas, ni claves Jira.
6. El tono debe ser formal, directo y seguro, como lo escribiría un Líder de QA senior.

Devuelve ÚNICAMENTE el párrafo, sin títulos, sin comillas, sin numeración, sin explicaciones adicionales.`;
        const improved = await askClaude(prompt);
        res.json({ success: true, data: { improved_text: improved.trim() } });
    }
    catch (error) {
        const isAxiosError = error?.isAxiosError;
        const code = error?.code;
        const status = error?.response?.status;
        const ollamaMsg = error?.response?.data?.error;
        console.error('[avales] Error mejorando observaciones con IA:', {
            code,
            status,
            ollamaError: ollamaMsg,
            message: error.message
        });
        let mensaje = 'Error al llamar a Ollama';
        if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
            mensaje = 'Ollama no está disponible en localhost:11434. Ejecuta: ollama serve';
        }
        else if (status === 404 || (ollamaMsg && ollamaMsg.includes('not found'))) {
            const model = process.env.OLLAMA_MODEL || 'llama3.2';
            mensaje = `Modelo "${model}" no encontrado en Ollama. Ejecuta: ollama pull ${model}`;
        }
        else if (ollamaMsg) {
            mensaje = ollamaMsg;
        }
        else if (error.message) {
            mensaje = error.message;
        }
        res.status(500).json({ success: false, error: mensaje });
    }
};
exports.mejorarObservaciones = mejorarObservaciones;
// ─── CRUD de Avales ───────────────────────────────────────────────────────────
const listAvales = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM avales ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error('[avales] Error listando avales:', error);
        res.status(500).json({ success: false, error: 'Error al listar avales' });
    }
};
exports.listAvales = listAvales;
const getAvalById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await db_1.pool.query('SELECT * FROM avales WHERE id = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, error: 'Aval no encontrado' });
        }
        const aval = rows[0];
        if (typeof aval.deploy_tasks === 'string')
            aval.deploy_tasks = JSON.parse(aval.deploy_tasks);
        if (typeof aval.required_inputs === 'string')
            aval.required_inputs = JSON.parse(aval.required_inputs);
        res.json({ success: true, data: aval });
    }
    catch (error) {
        console.error('[avales] Error obteniendo aval:', error);
        res.status(500).json({ success: false, error: 'Error al obtener aval' });
    }
};
exports.getAvalById = getAvalById;
const createAval = async (req, res) => {
    try {
        const { title, project_name, request_date, requester, responsible_team, current_env, target_env, qa_responsible, observations, deploy_tasks, required_inputs, qa_role, po_name, po_role, created_by } = req.body;
        if (!title || !project_name || !request_date || !requester || !responsible_team || !qa_responsible) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: title, project_name, request_date, requester, responsible_team, qa_responsible'
            });
        }
        const [result] = await db_1.pool.query(`INSERT INTO avales
        (title, project_name, request_date, requester, responsible_team,
         current_env, target_env, qa_responsible, observations,
         deploy_tasks, required_inputs, qa_role, po_name, po_role, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            title, project_name, request_date, requester, responsible_team,
            current_env || 'Preproduccion', target_env || 'Produccion',
            qa_responsible, observations || '',
            JSON.stringify(deploy_tasks || []),
            JSON.stringify(required_inputs || []),
            qa_role || 'Lider de QA', po_name || '', po_role || 'Cargo del PO',
            created_by || null
        ]);
        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Aval creado exitosamente'
        });
    }
    catch (error) {
        console.error('[avales] Error creando aval:', error);
        res.status(500).json({ success: false, error: 'Error al crear aval' });
    }
};
exports.createAval = createAval;
const updateAval = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, project_name, request_date, requester, responsible_team, current_env, target_env, qa_responsible, observations, deploy_tasks, required_inputs, qa_role, po_name, po_role } = req.body;
        await db_1.pool.query(`UPDATE avales SET
        title = ?, project_name = ?, request_date = ?, requester = ?,
        responsible_team = ?, current_env = ?, target_env = ?,
        qa_responsible = ?, observations = ?, deploy_tasks = ?,
        required_inputs = ?, qa_role = ?, po_name = ?, po_role = ?
       WHERE id = ?`, [
            title, project_name, request_date, requester, responsible_team,
            current_env, target_env, qa_responsible, observations,
            JSON.stringify(deploy_tasks || []),
            JSON.stringify(required_inputs || []),
            qa_role, po_name, po_role, id
        ]);
        res.json({ success: true, message: 'Aval actualizado exitosamente' });
    }
    catch (error) {
        console.error('[avales] Error actualizando aval:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar aval' });
    }
};
exports.updateAval = updateAval;
const deleteAval = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await db_1.pool.query('DELETE FROM avales WHERE id = ?', [id]);
        res.json({ success: true, message: 'Aval eliminado exitosamente' });
    }
    catch (error) {
        console.error('[avales] Error eliminando aval:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar aval' });
    }
};
exports.deleteAval = deleteAval;
// ─── Helper: credenciales Confluence (usa Jira como fallback — misma cuenta Atlassian) ──
function getConfluenceCreds() {
    const baseUrl = process.env.CONFLUENCE_BASE_URL || process.env.JIRA_HOST;
    const email = process.env.CONFLUENCE_EMAIL || process.env.JIRA_EMAIL || process.env.JIRA_USER;
    // JIRA_API_TOKEN es la fuente fiable; CONFLUENCE_API_TOKEN es fallback por si se sobreescribe
    const apiToken = process.env.JIRA_API_TOKEN || process.env.CONFLUENCE_API_TOKEN;
    return { baseUrl, email, apiToken };
}
// ─── Test de conexión con Confluence (lista espacios disponibles) ─────────────
const testConfluence = async (req, res) => {
    try {
        const { baseUrl, email, apiToken } = getConfluenceCreds();
        if (!baseUrl || !email || !apiToken) {
            return res.status(500).json({
                success: false,
                error: 'Faltan variables de entorno: CONFLUENCE_BASE_URL (o JIRA_HOST), JIRA_EMAIL, JIRA_API_TOKEN'
            });
        }
        const authBase64 = Buffer.from(`${email}:${apiToken}`).toString('base64');
        // Listar primeros 50 espacios para que el usuario elija el correcto
        const spacesRes = await axios_1.default.get(`${baseUrl}/wiki/rest/api/space?limit=50&type=global`, {
            headers: {
                Authorization: `Basic ${authBase64}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const spaces = spacesRes.data.results.map((s) => ({
            key: s.key,
            name: s.name,
            type: s.type
        }));
        // También intentar el espacio personal del usuario
        try {
            const personalRes = await axios_1.default.get(`${baseUrl}/wiki/rest/api/space?limit=20&type=personal`, {
                headers: { Authorization: `Basic ${authBase64}`, 'Content-Type': 'application/json' }
            });
            const personal = personalRes.data.results.map((s) => ({
                key: s.key,
                name: s.name,
                type: 'personal'
            }));
            spaces.push(...personal);
        }
        catch { /* ignorar si falla el personal */ }
        res.json({
            success: true,
            message: 'Conexión con Confluence exitosa',
            data: {
                user: email,
                baseUrl,
                spaces,
                configured_space_key: process.env.CONFLUENCE_SPACE_KEY || '(no configurado)'
            }
        });
    }
    catch (error) {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || error?.message || 'Error desconocido';
        console.error('[avales] Error test Confluence:', { status, msg });
        let hint = '';
        if (status === 403)
            hint = 'El token API no tiene acceso a Confluence o la cuenta no tiene licencia de Confluence.';
        if (status === 401)
            hint = 'Credenciales incorrectas. Verifica JIRA_API_TOKEN y JIRA_EMAIL en el .env';
        res.status(status || 500).json({ success: false, error: msg, hint });
    }
};
exports.testConfluence = testConfluence;
// ─── Helper: buscar o crear una página en Confluence ─────────────────────────
/**
 * Busca una página por título dentro de un espacio y (opcionalmente) como hija de un ancestro.
 * Si no existe, la crea con contenido vacío.
 * Devuelve el ID numérico de la página (string).
 */
async function findOrCreatePage(baseUrl, authBase64, spaceKey, title, parentId, placeholder) {
    // Buscar primero — sin filtro de tipo para encontrar tanto pages como folders
    const searchUrl = `${baseUrl}/wiki/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&title=${encodeURIComponent(title)}&expand=version,ancestors`;
    const searchRes = await axios_1.default.get(searchUrl, {
        headers: { Authorization: `Basic ${authBase64}`, 'Content-Type': 'application/json' }
    });
    const results = searchRes.data.results || [];
    // Si hay ancestro, filtrar por él
    const found = parentId
        ? results.find(p => p.ancestors?.some((a) => String(a.id) === String(parentId)))
        : results[0];
    if (found) {
        return String(found.id);
    }
    // No existe → crear la página vacía (carpeta)
    const createBody = {
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
            storage: {
                value: placeholder || `<p>${title}</p>`,
                representation: 'storage'
            }
        }
    };
    if (parentId) {
        createBody.ancestors = [{ id: parentId }];
    }
    const createRes = await axios_1.default.post(`${baseUrl}/wiki/rest/api/content`, createBody, {
        headers: { Authorization: `Basic ${authBase64}`, 'Content-Type': 'application/json' }
    });
    return String(createRes.data.id);
}
// ─── Publicar en Confluence ───────────────────────────────────────────────────
const publishToConfluence = async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Obtener el aval completo
        const [rows] = await db_1.pool.query('SELECT * FROM avales WHERE id = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, error: 'Aval no encontrado' });
        }
        const aval = rows[0];
        const deployTasks = typeof aval.deploy_tasks === 'string'
            ? JSON.parse(aval.deploy_tasks) : aval.deploy_tasks;
        const requiredInputs = typeof aval.required_inputs === 'string'
            ? JSON.parse(aval.required_inputs) : aval.required_inputs;
        const { baseUrl, email, apiToken } = getConfluenceCreds();
        const spaceKey = process.env.CONFLUENCE_SPACE_KEY;
        if (!baseUrl || !email || !apiToken || !spaceKey) {
            return res.status(500).json({
                success: false,
                error: 'Faltan variables de entorno: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN, CONFLUENCE_SPACE_KEY'
            });
        }
        // El spaceKey no debe ser un UUID/accountId (formato ~xxxhex) — debe ser la clave de texto del espacio
        if (/^~[0-9a-f]{16,}$/i.test(spaceKey)) {
            return res.status(400).json({
                success: false,
                error: `CONFLUENCE_SPACE_KEY="${spaceKey}" parece un ID interno, no una clave de espacio. Ve a Avales → Config Confluence → Probar conexión para ver las claves disponibles (ej: CALIDAD, QA, ~camilosoto).`
            });
        }
        const authBase64 = Buffer.from(`${email}:${apiToken}`).toString('base64');
        // Formatear fecha
        const fechaFormateada = new Date(aval.request_date).toLocaleDateString('es-CO', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const jiraBase = (process.env.JIRA_HOST || 'https://coxti.atlassian.net').replace(/\/$/, '');
        // HTML puro — sin macros ac: que causan NotFoundException en Confluence Cloud
        const deployTasksRows = deployTasks.map((task) => `
      <tr>
        <td>
          <a href="${jiraBase}/browse/${task.jira_key}" target="_blank"><strong>${task.jira_key}</strong></a>
          ${task.description ? ' — ' + task.description : ''}
          
        </td>
        <td>${task.notes || ''}</td>
      </tr>`).join('');
        const requiredInputsHtml = requiredInputs.map((input) => `
      <p>${input.checked ? '&#9745;' : '&#9744;'} ${input.label}</p>`).join('');
        // Cargar firma como base64 para Confluence
        let firmaQaHtml = '&nbsp;';
        try {
            const firmaPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'firma_camilo.png');
            if (fs.existsSync(firmaPath)) {
                const firmaBuffer = fs.readFileSync(firmaPath);
                const firmaBase64 = firmaBuffer.toString('base64');
                firmaQaHtml = `<img src="data:image/png;base64,${firmaBase64}" alt="Firma QA" width="120" />`;
            }
        }
        catch { /* sin firma */ }
        const jiraKeysLinked = deployTasks
            .map(t => `<a href="${jiraBase}/browse/${t.jira_key}">${t.jira_key}</a>`)
            .join(', ');
        const pageContent = `
<p><strong>Fecha</strong></p>
<p>${fechaFormateada}</p>

<h2>Informacion General</h2>
<ul>
  <li><strong>Proyecto:</strong> ${aval.project_name}</li>
  <li><strong>Fecha de solicitud del Aval:</strong> ${fechaFormateada}</li>
  <li><strong>Solicitante:</strong> ${aval.requester}</li>
  <li><strong>Equipo responsable:</strong> ${aval.responsible_team}</li>
  <li><strong>Ambiente actual:</strong> ${aval.current_env}</li>
  <li><strong>Ambiente destino:</strong> ${aval.target_env}</li>
</ul>

<h2>Responsables</h2>
<p><strong>${aval.qa_responsible}</strong></p>

<h2>Observaciones</h2>
<ul>
  <li>
    Yo, ${aval.qa_responsible}, en nombre del equipo de QA, el dia ${new Date(aval.request_date).toLocaleDateString('es-CO')} doy mi aval
    para la salida a produccion de las tareas [${jiraKeysLinked}].
    Este aval se fundamenta en las siguientes consideraciones:
    <ul>
      <li>a. Pruebas funcionales: Se han ejecutado todas las pruebas funcionales, y todos los casos han sido exitosamente validados</li>
    </ul>
  </li>
  <li>El equipo de aseguramiento de la calidad ha completado la validación funcional de los requisitos y los criterios de aceptación establecidos para las historias de usuario, garantizando que el comportamiento esperado del sistema se cumpla en el entorno de preproducción. Sin embargo, el alcance de estas pruebas no incluye la verificación de la infraestructura subyacente, por lo que aspectos como la configuración de la red, los recursos del servidor y la monitorización de la capa de plataforma no fueron objeto de cobertura. En consecuencia, la estabilidad del servicio a lo largo del tiempo, especialmente frente a variaciones en la carga y a posibles incidentes de infraestructura, queda fuera de la garantía que brinda el proceso de QA. Se recomienda complementar este aval con auditorías de arquitectura y pruebas de resiliencia para asegurar la continuidad operativa en producción.</li>
  <li>${aval.observations || 'Por lo tanto, considero que las tareas descritas estan listas para ser implementadas en produccion.'}</li>
</ul>

<h2>Lista de despliegue</h2>
<table>
  <thead>
    <tr>
      <th>Tarea (Jira)</th>
      <th>Notas</th>
    </tr>
  </thead>
  <tbody>
    ${deployTasksRows}
  </tbody>
</table>

<h2>Insumos requeridos para validacion en produccion</h2>
<p style="background-color:#FFF3CD;padding:8px;border-left:4px solid #FFC107;"><strong>IMPORTANTE:</strong> Los insumos listados a continuación son <strong>requisitos indispensables</strong> para dar inicio a las pruebas en el ambiente de producción. La disponibilidad oportuna de estos elementos es responsabilidad directa de <strong>${aval.requester || 'el solicitante'}</strong>, infraestructura y negocio. <strong>De no contar con la totalidad de los insumos marcados, las pruebas en producción no podrán iniciar</strong>, lo que podría generar retrasos en el despliegue y comprometer los tiempos de entrega acordados.</p>
${requiredInputsHtml}

<h2>Constancia</h2>
<table>
  <thead>
    <tr>
      <th>Firmas de quien entrega (QA)</th>
      <th>Rol en la empresa</th>
      <th>Firmas de quien recibe (PO)</th>
      <th>Rol en la empresa</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${firmaQaHtml}</td>
      <td>${aval.qa_role || 'Lider de QA'}</td>
      <td>${aval.po_name || '&lt;Nombre del PO&gt;'}</td>
      <td>${aval.po_role || 'Cargo del PO'}</td>
    </tr>
  </tbody>
</table>`;
        const pageTitle = aval.title;
        // ── Paso 1: Encontrar la página raíz "Avales QA" (NUNCA se crea automáticamente) ───
        // Se usa CONFLUENCE_PARENT_PAGE_ID si tiene valor; si no, se busca por título en el espacio.
        const rootTitle = process.env.CONFLUENCE_AVALES_ROOT_TITLE || 'Avales QA';
        let avalesQaPageId = process.env.CONFLUENCE_PARENT_PAGE_ID?.trim() || null;
        if (!avalesQaPageId) {
            console.log(`[avales] Buscando página raíz existente: "${rootTitle}"...`);
            // Sin filtro de tipo para encontrar tanto páginas como carpetas (folder)
            const rootSearchUrl = `${baseUrl}/wiki/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&title=${encodeURIComponent(rootTitle)}&expand=version`;
            const rootSearchRes = await axios_1.default.get(rootSearchUrl, {
                headers: { Authorization: `Basic ${authBase64}`, 'Content-Type': 'application/json' }
            });
            const rootResults = rootSearchRes.data.results || [];
            if (!rootResults.length) {
                return res.status(400).json({
                    success: false,
                    error: `No se encontró la carpeta/página "${rootTitle}" en el espacio "${spaceKey}". Configura CONFLUENCE_PARENT_PAGE_ID con su ID numérico: abre la carpeta en Confluence y copia el número de la URL (.../pages/XXXXXXX/...).`
                });
            }
            avalesQaPageId = String(rootResults[0].id);
            console.log(`[avales] Página raíz "${rootTitle}" encontrada, ID: ${avalesQaPageId}`);
        }
        // ── Paso 2: Encontrar/crear subcarpeta del proyecto ───────────────────────
        const projectName = aval.project_name?.trim() || 'Sin Proyecto';
        console.log(`[avales] Buscando/creando subcarpeta: "${projectName}" bajo ID ${avalesQaPageId}...`);
        const projectPageId = await findOrCreatePage(baseUrl, authBase64, spaceKey, projectName, avalesQaPageId, `<p>Avales QA del proyecto <strong>${projectName}</strong>.</p>`);
        console.log(`[avales] Página proyecto "${projectName}" ID: ${projectPageId}`);
        // ── Paso 3: Crear o actualizar el aval bajo la carpeta del proyecto ───────
        let pageId = aval.confluence_page_id;
        let method = 'POST';
        let url = `${baseUrl}/wiki/rest/api/content`;
        let currentVersion = 1;
        if (pageId) {
            // Verificar si la página aún existe y obtener su versión actual
            try {
                const existing = await axios_1.default.get(`${baseUrl}/wiki/rest/api/content/${pageId}`, {
                    headers: { Authorization: `Basic ${authBase64}`, 'Content-Type': 'application/json' }
                });
                currentVersion = existing.data.version.number + 1;
                method = 'PUT';
                url = `${baseUrl}/wiki/rest/api/content/${pageId}`;
                console.log(`[avales] Actualizando página existente ID ${pageId} (v${currentVersion})`);
            }
            catch {
                // La página ya no existe en Confluence — crear nueva
                pageId = null;
                method = 'POST';
                url = `${baseUrl}/wiki/rest/api/content`;
                console.log('[avales] Página anterior no encontrada, creando nueva...');
            }
        }
        const body = {
            type: 'page',
            title: pageTitle,
            space: { key: spaceKey },
            body: {
                storage: {
                    value: pageContent,
                    representation: 'storage'
                }
            }
        };
        // Para creación: colocar bajo la carpeta del proyecto
        if (method === 'POST') {
            body.ancestors = [{ id: projectPageId }];
        }
        if (method === 'PUT') {
            body.version = { number: currentVersion };
        }
        const confluenceRes = await (0, axios_1.default)({
            method,
            url,
            headers: {
                Authorization: `Basic ${authBase64}`,
                'Content-Type': 'application/json'
            },
            data: body
        });
        const newPageId = confluenceRes.data.id;
        const pageUrl = `${baseUrl}/wiki${confluenceRes.data._links.webui}`;
        // Guardar referencia en BD
        await db_1.pool.query('UPDATE avales SET confluence_page_id = ?, confluence_page_url = ? WHERE id = ?', [newPageId, pageUrl, id]);
        res.json({
            success: true,
            message: `Aval publicado en Confluence → ${rootTitle} / ${projectName} / ${pageTitle}`,
            data: { pageId: newPageId, pageUrl }
        });
    }
    catch (error) {
        console.error('[avales] Error publicando en Confluence:', error?.response?.data || error);
        const msg = error?.response?.data?.message || error?.message || 'Error desconocido';
        res.status(500).json({ success: false, error: `Error al publicar en Confluence: ${msg}` });
    }
};
exports.publishToConfluence = publishToConfluence;
//# sourceMappingURL=aval.controller.js.map