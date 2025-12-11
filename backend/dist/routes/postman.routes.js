"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const postman_controller_1 = require("../controllers/postman.controller");
const router = (0, express_1.Router)();
// Rutas de testing sin autenticación
router.post("/test-run", postman_controller_1.runPostmanCollection);
router.post("/test-newman", postman_controller_1.testNewman);
router.post("/test-long", postman_controller_1.testLongRequest);
router.post("/test-retry", postman_controller_1.runPostmanWithRetry);
// Endpoints específicos para tipos de prueba - sin auth para testing
router.post("/contract-results", postman_controller_1.getContractTestResults);
router.post("/response-results", postman_controller_1.getResponseTestResults);
router.post("/controlled-response-results", postman_controller_1.getControlledResponseTestResults);
// Endpoint temporal para debug - obtener resultados sin auth
router.get("/debug-results", postman_controller_1.getPostmanResults);
// Aplicar autenticación a las demás rutas
router.use(auth_1.auth);
// Ejecutar colección de Postman (archivo local o URL)
router.post("/run", postman_controller_1.runPostmanCollection);
// Ejecutar colección específicamente desde URL
router.post("/run-url", postman_controller_1.runPostmanFromUrl);
// Probar Newman y diagnóstico
router.post("/test", postman_controller_1.testNewman);
// Procesar resultados existentes de un archivo JSON
router.post("/process-results", postman_controller_1.processExistingResults);
// Obtener resultados
router.get("/results", postman_controller_1.getPostmanResults);
// Obtener resultados con assertions detalladas
router.get("/results-with-assertions", postman_controller_1.getPostmanResultsWithAssertions);
// Eliminar resultados
router.delete("/results", postman_controller_1.deletePostmanResults);
exports.default = router;
//# sourceMappingURL=postman.routes.js.map