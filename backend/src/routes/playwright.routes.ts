import { Router } from 'express';
import { 
  getAvailableProjects,
  getSummary, 
  getDaily, 
  getTopFailures, 
  listResults,
  getContractResults,
  getControlledResponseResults,
  getOtherResponseResults
} from '../controllers/playwright.controller';

const router = Router();

// Endpoint para obtener proyectos disponibles dinámicamente
router.get('/projects', getAvailableProjects);

router.get('/summary', getSummary);
router.get('/daily', getDaily);
router.get('/top-failures', getTopFailures);
router.get('/results', listResults);

// Endpoints filtrados por proyecto y tipo de prueba
router.post('/contract-results', getContractResults);
router.post('/controlled-response-results', getControlledResponseResults);
router.post('/response-results', getOtherResponseResults);

export default router;
