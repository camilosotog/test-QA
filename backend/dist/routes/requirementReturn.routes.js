"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requirementReturn_controller_1 = require("../controllers/requirementReturn.controller");
const router = (0, express_1.Router)();
// CRUD básico
router.get('/', requirementReturn_controller_1.listReturns);
router.get('/statistics/by-po', requirementReturn_controller_1.getStatisticsByPO);
router.get('/statistics/by-month', requirementReturn_controller_1.getStatisticsByMonth);
router.get('/date-range', requirementReturn_controller_1.getReturnsByDateRange);
router.get('/:id', requirementReturn_controller_1.getReturnById);
router.post('/', requirementReturn_controller_1.createReturn);
router.put('/:id', requirementReturn_controller_1.updateReturn);
router.delete('/:id', requirementReturn_controller_1.deleteReturn);
exports.default = router;
//# sourceMappingURL=requirementReturn.routes.js.map