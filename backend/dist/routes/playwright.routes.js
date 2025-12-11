"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playwright_controller_1 = require("../controllers/playwright.controller");
const router = (0, express_1.Router)();
// Endpoint para obtener proyectos disponibles dinámicamente
router.get('/projects', playwright_controller_1.getAvailableProjects);
router.get('/summary', playwright_controller_1.getSummary);
router.get('/daily', playwright_controller_1.getDaily);
router.get('/top-failures', playwright_controller_1.getTopFailures);
router.get('/results', playwright_controller_1.listResults);
// Endpoints filtrados por proyecto y tipo de prueba
router.post('/contract-results', playwright_controller_1.getContractResults);
router.post('/controlled-response-results', playwright_controller_1.getControlledResponseResults);
router.post('/response-results', playwright_controller_1.getOtherResponseResults);
exports.default = router;
//# sourceMappingURL=playwright.routes.js.map