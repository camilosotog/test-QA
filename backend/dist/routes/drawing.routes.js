"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const drawing_controller_1 = require("../controllers/drawing.controller");
const router = (0, express_1.Router)();
// Obtener datos actuales del dibujo
router.get('/data', auth_1.auth, drawing_controller_1.getDrawingData);
// Limpiar canvas (solo usuarios autenticados)
router.post('/clear', auth_1.auth, drawing_controller_1.clearDrawing);
exports.default = router;
//# sourceMappingURL=drawing.routes.js.map