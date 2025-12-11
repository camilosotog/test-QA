"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const qaItems_controller_1 = require("../controllers/qaItems.controller");
const boardsBySprint_controller_1 = require("../controllers/boardsBySprint.controller");
const r = (0, express_1.Router)();
r.use(auth_1.auth);
r.post("/", qaItems_controller_1.createSprint);
r.get("/", qaItems_controller_1.listSprints);
r.get("/boards", qaItems_controller_1.getBoardsBySprint);
r.get("/:sprintId/boards", boardsBySprint_controller_1.getBoardsBySprintId);
r.get("/:id", qaItems_controller_1.getSprint);
r.put("/:id", qaItems_controller_1.updateSprint);
r.delete("/:id", qaItems_controller_1.deleteSprint);
exports.default = r;
//# sourceMappingURL=sprints.routes.js.map