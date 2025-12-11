"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const items_controller_1 = require("../controllers/items.controller");
const r = (0, express_1.Router)();
r.use(auth_1.auth);
r.post("/", items_controller_1.createItem);
r.get("/", items_controller_1.listItems);
exports.default = r;
//# sourceMappingURL=items.routes.js.map