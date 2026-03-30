"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aval_controller_1 = require("../controllers/aval.controller");
const router = (0, express_1.Router)();
router.get('/test-confluence', aval_controller_1.testConfluence);
router.post('/mejorar', aval_controller_1.mejorarObservaciones);
router.get('/', aval_controller_1.listAvales);
router.get('/:id', aval_controller_1.getAvalById);
router.post('/', aval_controller_1.createAval);
router.put('/:id', aval_controller_1.updateAval);
router.delete('/:id', aval_controller_1.deleteAval);
router.post('/:id/publish', aval_controller_1.publishToConfluence);
exports.default = router;
//# sourceMappingURL=aval.routes.js.map