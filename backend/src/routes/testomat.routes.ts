import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { db } from '../config/db';
import multer from 'multer';
import {
  // Projects
  getTestProjects,
  getTestProjectById,
  createTestProject,
  updateTestProject,
  // Suites
  getTestSuites,
  createTestSuite,
  // Cases
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  // Executions (old - to be replaced)
  getTestExecutions,
  getTestExecutionById,
  createTestExecution,
  // Results
  createTestResult,
  // Analytics
  getProjectAnalytics,
  // Import
  importFromTestomat,
} from '../controllers/testomat.controller';

import {
  createTestExecution as createExecution,
  getTestExecutions as getExecutions,
  getTestExecution,
  saveTestResult,
  completeTestExecution,
  reopenTestExecution,
  recalculateAllExecutionStatuses,
  getTestResult,
  deleteEvidence,
  deleteTestExecution
} from '../controllers/testExecution.controller';

// Configurar multer para upload de archivos
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// ========== TEST PROJECTS ==========
/**
 * GET /api/test-projects
 * Obtener todos los proyectos de prueba
 */
router.get('/projects', auth, getTestProjects);

/**
 * GET /api/test-projects/:projectId
 * Obtener proyecto específico
 */
router.get('/projects/:projectId', auth, getTestProjectById);

/**
 * POST /api/test-projects
 * Crear nuevo proyecto
 * Body: { name, description?, project_id? }
 */
router.post('/projects', auth, createTestProject);

/**
 * PUT /api/test-projects/:projectId
 * Actualizar proyecto
 * Body: { name?, description? }
 */
router.put('/projects/:projectId', auth, updateTestProject);

// ========== TEST SUITES ==========
/**
 * GET /api/test-projects/:projectId/suites
 * Obtener suites de un proyecto
 */
router.get('/projects/:projectId/suites', auth, getTestSuites);

/**
 * POST /api/test-projects/:projectId/suites
 * Crear nueva suite
 * Body: { name, description?, status?, order_index? }
 */
router.post('/projects/:projectId/suites', auth, (req, res) => {
  req.body.test_project_id = parseInt(req.params.projectId || '0');
  createTestSuite(req, res);
});

/**
 * GET /api/test-projects/:projectId/suites/check-name
 * Verificar si ya existe una suite con ese nombre en el proyecto
 * Query params: name (requerido)
 */
router.get('/projects/:projectId/suites/check-name', auth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId || '0');
    const name = req.query.name as string;
    
    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }
    
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la suite es requerido' });
    }

    const [rows] = await db.query(
      'SELECT id, name FROM test_suites WHERE test_project_id = ? AND name = ?',
      [projectId, name]
    ) as any;
    
    const exists = rows && rows.length > 0;
    
    res.json({ 
      exists,
      message: exists ? `Ya existe una suite con el nombre "${name}"` : null,
      existingSuite: exists ? rows[0] : null
    });
  } catch (error) {
    console.error('Error al verificar nombre de suite:', error);
    res.status(500).json({ message: 'Error al verificar el nombre de la suite' });
  }
});

/**
 * GET /api/suites/:suiteId
 * Obtener una suite específica
 */
router.get('/suites/:suiteId', auth, async (req, res) => {
  try {
    const suiteId = parseInt(req.params.suiteId || '0');
    
    if (!suiteId || isNaN(suiteId)) {
      return res.status(400).json({ message: 'ID de suite inválido' });
    }

    const [rows] = await db.query('SELECT * FROM test_suites WHERE id = ?', [suiteId]) as any;
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Suite no encontrada' });
    }

    const suite = rows[0];
    res.json(suite);
  } catch (error) {
    console.error('Error al obtener suite:', error);
    res.status(500).json({ message: 'Error al obtener la suite' });
  }
});

/**
 * PUT /api/testomat/suites/:suiteId
 * Actualizar una suite
 * Body: { name?, description?, status?, order_index? }
 */
router.put('/suites/:suiteId', auth, async (req, res) => {
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
    const [result] = await db.query(query, updateValues) as any;

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Suite no encontrada' });
    }

    // Obtener la suite actualizada
    const [rows] = await db.query('SELECT * FROM test_suites WHERE id = ?', [suiteId]) as any;
    res.json({
      message: 'Suite actualizada correctamente',
      suite: rows[0]
    });
  } catch (error) {
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
router.get('/suites/:suiteId/cases', auth, getTestCases);

/**
 * GET /api/test-cases/:caseId
 * Obtener caso específico con historial
 */
router.get('/cases/:caseId', auth, getTestCaseById);

/**
 * POST /api/test-cases
 * Crear nuevo caso de prueba
 * Body: { test_suite_id, test_project_id, name, description?, preconditions?, steps?, expected_result?, priority?, status?, automation_status?, automation_tool?, test_type?, requirement_id?, tags?, created_by? }
 */
router.post('/cases', auth, createTestCase);

/**
 * PUT /api/test-cases/:caseId
 * Actualizar caso de prueba
 * Body: { status?, priority?, automation_status?, tags?, updated_by? }
 */
router.put('/cases/:caseId', auth, updateTestCase);

/**
 * DELETE /api/test-cases/:caseId
 * Eliminar caso de prueba
 */
router.delete('/cases/:caseId', auth, deleteTestCase);

// ========== TEST EXECUTIONS ==========
/**
 * GET /api/testomat/executions
 * Obtener todas las ejecuciones
 */
router.get('/executions', auth, getExecutions);

/**
 * GET /api/testomat/executions/:executionId
 * Obtener ejecución específica con resultados
 */
router.get('/executions/:executionId', auth, getTestExecution);

/**
 * POST /api/testomat/suites/:suiteId/executions
 * Iniciar nueva ejecución de una suite
 */
router.post('/suites/:suiteId/executions', (req: any, res: any) => {
  req.body.test_suite_id = parseInt(req.params.suiteId || '0');
  // Simular un usuario autenticado para testing
  (req as any).user = { id: 2 };
  createExecution(req, res);
});

/**
 * POST /api/testomat/executions/:executionId/complete
 * Marcar ejecución como completada
 */
router.put('/executions/:executionId/complete', auth, completeTestExecution);

/**
 * PUT /api/testomat/executions/:executionId/update-board
 * 🆕 Actualiza el board con los datos de QA y Developer ejecutor
 */
router.put('/executions/:executionId/update-board', (req: any, res: any) => {
  const { executionId } = req.params;
  const { qa_id, dev_id } = req.body;

  if (!executionId || !qa_id) {
    return res.status(400).json({ error: 'executionId and qa_id are required' });
  }

  (async () => {
    try {
      // Obtener la ejecución para encontrar el nombre de la suite
      const [execution] = await db.query(
        'SELECT te.test_suite_id, ts.name as suite_name FROM test_executions te LEFT JOIN test_suites ts ON te.test_suite_id = ts.id WHERE te.id = ?',
        [executionId]
      ) as any;

      if (!execution || execution.length === 0) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      const suiteName = execution[0].suite_name;

      // Obtener nombres de usuarios
      const [qaUser] = await db.query(
        'SELECT name FROM users WHERE id = ?',
        [qa_id]
      ) as any;

      const [devUser] = await db.query(
        'SELECT name FROM users WHERE id = ?',
        [dev_id]
      ) as any;

      const qaName = qaUser && qaUser.length > 0 ? qaUser[0].name : 'Sin Asignar';
      const devName = devUser && devUser.length > 0 ? devUser[0].name : 'Sin Asignar';

      // Actualizar el board más reciente para esta suite (buscar por nombre de suite)
      const [updateResult] = await db.query(
        `UPDATE boards SET owner_id = ?, developer_id = ? WHERE name = ? ORDER BY created_at DESC LIMIT 1`,
        [qa_id, dev_id || qa_id, suiteName]
      ) as any;

      res.json({
        message: 'Board actualizado exitosamente',
        qa_name: qaName,
        dev_name: devName,
        rows_updated: updateResult.affectedRows
      });
    } catch (error) {
      console.error('❌ Error actualizando board:', error);
      res.status(500).json({ error: 'Error updating board', details: (error as any).message });
    }
  })();
});

/**
 * PUT /api/testomat/executions/:executionId/reopen
 * Reabre una ejecución completada (marca como "en progreso")
 */
router.put('/executions/:executionId/reopen', auth, reopenTestExecution);

/**
 * POST /api/testomat/admin/recalculate-statuses
 * Recalcular estados de todas las ejecuciones
 * Admin endpoint para corregir estados incorrectos
 */
router.post('/admin/recalculate-statuses', auth, recalculateAllExecutionStatuses);

// ========== TEST RESULTS ==========
/**
 * POST /api/testomat/results
 * Guardar resultado de un caso en una ejecución
 * Body: { test_case_id, execution_id, status, notes?, tester_name? }
 * Files: evidencia (opcional)
 */
router.post('/results', auth, upload.array('evidence'), saveTestResult);

/**
 * GET /api/testomat/results/:test_case_id/:execution_id
 * Obtener resultado de un caso específico
 */
router.get('/results/:test_case_id/:execution_id', auth, getTestResult);

/**
 * DELETE /api/testomat/executions/:executionId/cases/:caseId/evidence
 * Eliminar una evidencia específica de un resultado
 * Body: { evidenceUrl: string }
 */
router.delete('/executions/:executionId/cases/:caseId/evidence', auth, deleteEvidence);

/**
 * DELETE /api/testomat/executions/:executionId
 * Eliminar una ejecución completa con todos sus resultados y evidencias
 */
router.delete('/executions/:executionId', auth, deleteTestExecution);

// ========== ANALYTICS ==========
/**
 * GET /api/test-projects/:projectId/analytics
 * Obtener analytics del proyecto
 */
router.get('/projects/:projectId/analytics', auth, getProjectAnalytics);

// ========== IMPORT ==========
/**
 * POST /api/test-projects/import/testomat
 * Iniciar importación desde TestOmat.io
 * Body: { projectName, apiKey, workspaceId, suiteIds? }
 */
router.post('/import/testomat', auth, importFromTestomat);

export default router;
