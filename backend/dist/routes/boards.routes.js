"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const boards_controller_1 = require("../controllers/boards.controller");
const r = (0, express_1.Router)();
r.use(auth_1.auth);
r.post("/", boards_controller_1.createBoard);
r.get("/", boards_controller_1.listBoards);
exports.default = r;
//# sourceMappingURL=boards.routes.js.map