"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const qaItems_controller_1 = require("../controllers/qaItems.controller");
const r = (0, express_1.Router)();
r.use(auth_1.auth);
r.get("/", qaItems_controller_1.listQAItems);
r.get("/check-duplicate", qaItems_controller_1.checkDuplicateTask);
r.get("/statistics", qaItems_controller_1.getQAStatistics);
r.post("/", qaItems_controller_1.createQAItem);
r.get("/:id", qaItems_controller_1.getQAItem);
r.put("/:id", qaItems_controller_1.updateQAItem);
r.delete("/:id", qaItems_controller_1.deleteQAItem);
exports.default = r;
//# sourceMappingURL=qaItems.routes.js.map