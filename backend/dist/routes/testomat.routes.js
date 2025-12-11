"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const db_1 = require("../config/db");
const multer_1 = __importDefault(require("multer"));
const testomat_controller_1 = require("../controllers/testomat.controller");
const testExecution_controller_1 = require("../controllers/testExecution.controller");
// Configurar multer para upload de archivos
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
// ========== TEST PROJECTS ==========
/**
 * GET /api/test-projects
 * Obtener todos los proyectos de prueba
 */
router.get('/projects', auth_1.auth, testomat_controller_1.getTestProjects);
/**
 * GET /api/test-projects/:projectId
 * Obtener proyecto específico
 */
router.get('/projects/:projectId', auth_1.auth, testomat_controller_1.getTestProjectById);
/**
 * POST /api/test-projects
 * Crear nuevo proyecto
 * Body: { name, description?, project_id? }
 */
router.post('/projects', auth_1.auth, testomat_controller_1.createTestProject);
/**
 * PUT /api/test-projects/:projectId
 * Actualizar proyecto
 * Body: { name?, description? }
 */
router.put('/projects/:projectId', auth_1.auth, testomat_controller_1.updateTestProject);
// ========== TEST SUITES ==========
/**
 * GET /api/test-projects/:projectId/suites
 * Obtener suites de un proyecto
 */
router.get('/projects/:projectId/suites', auth_1.auth, testomat_controller_1.getTestSuites);
/**
 * POST /api/test-projects/:projectId/suites
 * Crear nueva suite
 * Body: { name, description?, status?, order_index? }
 */
router.post('/projects/:projectId/suites', auth_1.auth, (req, res) => {
    req.body.test_project_id = parseInt(req.params.projectId || '0');
    (0, testomat_controller_1.createTestSuite)(req, res);
});
/**
 * GET /api/test-projects/:projectId/suites/check-name
 * Verificar si ya existe una suite con ese nombre en el proyecto
 * Query params: name (requerido)
 */
router.get('/projects/:projectId/suites/check-name', auth_1.auth, async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId || '0');
        const name = req.query.name;
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({ message: 'ID de proyecto inválido' });
        }
        if (!name) {
            return res.status(400).json({ message: 'El nombre de la suite es requerido' });
        }
        const [rows] = await db_1.db.query('SELECT id, name FROM test_suites WHERE test_project_id = ? AND name = ?', [projectId, name]);
        const exists = rows && rows.length > 0;
        res.json({
            exists,
            message: exists ? `Ya existe una suite con el nombre "${name}"` : null,
            existingSuite: exists ? rows[0] : null
        });
    }
    catch (error) {
        console.error('Error al verificar nombre de suite:', error);
        res.status(500).json({ message: 'Error al verificar el nombre de la suite' });
    }
});
/**
 * GET /api/suites/:suiteId
 * Obtener una suite específica
 */
router.get('/suites/:suiteId', auth_1.auth, async (req, res) => {
    try {
        const suiteId = parseInt(req.params.suiteId || '0');
        if (!suiteId || isNaN(suiteId)) {
            return res.status(400).json({ message: 'ID de suite inválido' });
        }
        const [rows] = await db_1.db.query('SELECT * FROM test_suites WHERE id = ?', [suiteId]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Suite no encontrada' });
        }
        const suite = rows[0];
        res.json(suite);
    }
    catch (error) {
        console.error('Error al obtener suite:', error);
        res.status(500).json({ message: 'Error al obtener la suite' });
    }
});
/**
 * PUT /api/testomat/suites/:suiteId
 * Actualizar una suite
 * Body: { name?, description?, status?, order_index? }
 */
router.put('/suites/:suiteId', auth_1.auth, async (req, res) => {
    try {
        const suiteId = parseInt(req.params.suiteId || '0');
        if (!suiteId || isNaN(suiteId)) {
            return res.status(400).json({ message: 'ID de suite inválido' });
        }
        const { name, description, status, order_index } = req.body;
        // Construir query dinámico solo con campos proporcionados
        let updateFields = [];
        let updateValues = [];
        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (order_index !== undefined) {
            updateFields.push('order_index = ?');
            updateValues.push(order_index);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar' });
        }
        updateValues.push(suiteId);
        const query = `UPDATE test_suites SET ${updateFields.join(', ')} WHERE id = ?`;
        const [result] = await db_1.db.query(query, updateValues);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Suite no encontrada' });
        }
        // Obtener la suite actualizada
        const [rows] = await db_1.db.query('SELECT * FROM test_suites WHERE id = ?', [suiteId]);
        res.json({
            message: 'Suite actualizada correctamente',
            suite: rows[0]
        });
    }
    catch (error) {
        console.error('Error al actualizar suite:', error);
        res.status(500).json({ message: 'Error al actualizar la suite' });
    }
});
// ========== TEST CASES ==========
/**
 * GET /api/test-suites/:suiteId/cases
 * Obtener casos de una suite
 * Query params: status?, test_type?, automation_status?
 */
router.get('/suites/:suiteId/cases', auth_1.auth, testomat_controller_1.getTestCases);
/**
 * GET /api/test-cases/:caseId
 * Obtener caso específico con historial
 */
router.get('/cases/:caseId', auth_1.auth, testomat_controller_1.getTestCaseById);
/**
 * POST /api/test-cases
 * Crear nuevo caso de prueba
 * Body: { test_suite_id, test_project_id, name, description?, preconditions?, steps?, expected_result?, priority?, status?, automation_status?, automation_tool?, test_type?, requirement_id?, tags?, created_by? }
 */
router.post('/cases', auth_1.auth, testomat_controller_1.createTestCase);
/**
 * PUT /api/test-cases/:caseId
 * Actualizar caso de prueba
 * Body: { status?, priority?, automation_status?, tags?, updated_by? }
 */
router.put('/cases/:caseId', auth_1.auth, testomat_controller_1.updateTestCase);
/**
 * DELETE /api/test-cases/:caseId
 * Eliminar caso de prueba
 */
router.delete('/cases/:caseId', auth_1.auth, testomat_controller_1.deleteTestCase);
// ========== TEST EXECUTIONS ==========
/**
 * GET /api/testomat/executions
 * Obtener todas las ejecuciones
 */
router.get('/executions', auth_1.auth, testExecution_controller_1.getTestExecutions);
/**
 * GET /api/testomat/executions/:executionId
 * Obtener ejecución específica con resultados
 */
router.get('/executions/:executionId', auth_1.auth, testExecution_controller_1.getTestExecution);
/**
 * POST /api/testomat/suites/:suiteId/executions
 * Iniciar nueva ejecución de una suite
 */
router.post('/suites/:suiteId/executions', (req, res) => {
    req.body.test_suite_id = parseInt(req.params.suiteId || '0');
    // Simular un usuario autenticado para testing
    req.user = { id: 2 };
    (0, testExecution_controller_1.createTestExecution)(req, res);
});
/**
 * POST /api/testomat/executions/:executionId/complete
 * Marcar ejecución como completada
 */
router.put('/executions/:executionId/complete', auth_1.auth, testExecution_controller_1.completeTestExecution);
/**
 * PUT /api/testomat/executions/:executionId/update-board
 * 🆕 Actualiza el board con los datos de QA y Developer ejecutor
 */
router.put('/executions/:executionId/update-board', (req, res) => {
    const { executionId } = req.params;
    const { qa_id, dev_id } = req.body;
    if (!executionId || !qa_id) {
        return res.status(400).json({ error: 'executionId and qa_id are required' });
    }
    (async () => {
        try {
            // Obtener la ejecución para encontrar el nombre de la suite
            const [execution] = await db_1.db.query('SELECT te.test_suite_id, ts.name as suite_name FROM test_executions te LEFT JOIN test_suites ts ON te.test_suite_id = ts.id WHERE te.id = ?', [executionId]);
            if (!execution || execution.length === 0) {
                return res.status(404).json({ error: 'Execution not found' });
            }
            const suiteName = execution[0].suite_name;
            // Obtener nombres de usuarios
            const [qaUser] = await db_1.db.query('SELECT name FROM users WHERE id = ?', [qa_id]);
            const [devUser] = await db_1.db.query('SELECT name FROM users WHERE id = ?', [dev_id]);
            const qaName = qaUser && qaUser.length > 0 ? qaUser[0].name : 'Sin Asignar';
            const devName = devUser && devUser.length > 0 ? devUser[0].name : 'Sin Asignar';
            // Actualizar el board más reciente para esta suite (buscar por nombre de suite)
            const [updateResult] = await db_1.db.query(`UPDATE boards SET owner_id = ?, developer_id = ? WHERE name = ? ORDER BY created_at DESC LIMIT 1`, [qa_id, dev_id || qa_id, suiteName]);
            res.json({
                message: 'Board actualizado exitosamente',
                qa_name: qaName,
                dev_name: devName,
                rows_updated: updateResult.affectedRows
            });
        }
        catch (error) {
            console.error('❌ Error actualizando board:', error);
            res.status(500).json({ error: 'Error updating board', details: error.message });
        }
    })();
});
/**
 * PUT /api/testomat/executions/:executionId/reopen
 * Reabre una ejecución completada (marca como "en progreso")
 */
router.put('/executions/:executionId/reopen', auth_1.auth, testExecution_controller_1.reopenTestExecution);
/**
 * POST /api/testomat/admin/recalculate-statuses
 * Recalcular estados de todas las ejecuciones
 * Admin endpoint para corregir estados incorrectos
 */
router.post('/admin/recalculate-statuses', auth_1.auth, testExecution_controller_1.recalculateAllExecutionStatuses);
// ========== TEST RESULTS ==========
/**
 * POST /api/testomat/results
 * Guardar resultado de un caso en una ejecución
 * Body: { test_case_id, execution_id, status, notes?, tester_name? }
 * Files: evidencia (opcional)
 */
router.post('/results', auth_1.auth, upload.array('evidence'), testExecution_controller_1.saveTestResult);
/**
 * GET /api/testomat/results/:test_case_id/:execution_id
 * Obtener resultado de un caso específico
 */
router.get('/results/:test_case_id/:execution_id', auth_1.auth, testExecution_controller_1.getTestResult);
// ========== ANALYTICS ==========
/**
 * GET /api/test-projects/:projectId/analytics
 * Obtener analytics del proyecto
 */
router.get('/projects/:projectId/analytics', auth_1.auth, testomat_controller_1.getProjectAnalytics);
// ========== IMPORT ==========
/**
 * POST /api/test-projects/import/testomat
 * Iniciar importación desde TestOmat.io
 * Body: { projectName, apiKey, workspaceId, suiteIds? }
 */
router.post('/import/testomat', auth_1.auth, testomat_controller_1.importFromTestomat);
exports.default = router;
//# sourceMappingURL=testomat.routes.js.map