import { Router } from "express";
import { auth } from "../middlewares/auth";
import {
  runPostmanCollection,
  runPostmanFromUrl,
  runPostmanWithRetry,
  getPostmanResults,
  getPostmanResultsWithAssertions,
  getContractTestResults,
  getControlledResponseTestResults,
  getResponseTestResults,
  deletePostmanResults,
  processExistingResults,
  testNewman,
  testLongRequest,
} from "../controllers/postman.controller";

const router = Router();

// Rutas de testing sin autenticación
router.post("/test-run", runPostmanCollection);
router.post("/test-newman", testNewman);
router.post("/test-long", testLongRequest);
router.post("/test-retry", runPostmanWithRetry);

// Endpoints específicos para tipos de prueba - sin auth para testing
router.post("/contract-results", getContractTestResults);
router.post("/response-results", getResponseTestResults);
router.post("/controlled-response-results", getControlledResponseTestResults);

// Endpoint temporal para debug - obtener resultados sin auth
router.get("/debug-results", getPostmanResults);

// Aplicar autenticación a las demás rutas
router.use(auth);

// Ejecutar colección de Postman (archivo local o URL)
router.post("/run", runPostmanCollection);

// Ejecutar colección específicamente desde URL
router.post("/run-url", runPostmanFromUrl);

// Probar Newman y diagnóstico
router.post("/test", testNewman);

// Procesar resultados existentes de un archivo JSON
router.post("/process-results", processExistingResults);

// Obtener resultados
router.get("/results", getPostmanResults);

// Obtener resultados con assertions detalladas
router.get("/results-with-assertions", getPostmanResultsWithAssertions);

// Eliminar resultados
router.delete("/results", deletePostmanResults);

export default router;