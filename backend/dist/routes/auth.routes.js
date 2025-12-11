"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_controller_2 = require("../controllers/auth.controller");
const r = (0, express_1.Router)();
r.post("/login", auth_controller_1.login);
r.post("/register", auth_controller_1.register);
r.post("/logout-all", auth_controller_1.logoutAll);
r.post("/logout", auth_controller_2.logout);
exports.default = r;
//# sourceMappingURL=auth.routes.js.map