"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bugs_controller_1 = require("../controllers/bugs.controller");
const router = (0, express_1.Router)();
router.get('/months-summary', bugs_controller_1.listMonthsSummary);
router.get('/by-month/:monthKey', bugs_controller_1.listBugsBySpecificMonth);
router.get('/by-month', bugs_controller_1.listBugsByMonth);
router.get('/', bugs_controller_1.listBugs);
router.get('/:id', bugs_controller_1.getBugById);
router.post('/', bugs_controller_1.createBug);
router.put('/:id', bugs_controller_1.updateBug);
router.delete('/:id', bugs_controller_1.deleteBug);
exports.default = router;
//# sourceMappingURL=bugs.routes.js.map