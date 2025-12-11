"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const return_controller_1 = require("../controllers/return.controller");
const router = (0, express_1.Router)();
// Statistics routes (must come before parameterized routes)
router.get("/statistics/by-po", return_controller_1.getStatisticsByPO);
router.get("/statistics/by-month", return_controller_1.getStatisticsByMonth);
router.get("/date-range", return_controller_1.getReturnsByDateRange);
// CRUD routes
router.get("/", return_controller_1.listReturns);
router.get("/:id", return_controller_1.getReturnById);
router.post("/", return_controller_1.createReturn);
router.put("/:id", return_controller_1.updateReturn);
router.delete("/:id", return_controller_1.deleteReturn);
exports.default = router;
//# sourceMappingURL=return.routes.js.map