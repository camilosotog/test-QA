"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const automatedTasks_controller_1 = require("../controllers/automatedTasks.controller");
const router = (0, express_1.Router)();
router.get('/', automatedTasks_controller_1.getAutomatedTasks);
router.post('/', automatedTasks_controller_1.createAutomatedTask);
router.put('/:id', automatedTasks_controller_1.updateAutomatedTask);
router.delete('/:id', automatedTasks_controller_1.deleteAutomatedTask);
exports.default = router;
//# sourceMappingURL=automatedTasks.routes.js.map