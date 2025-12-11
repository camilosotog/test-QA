import { Router } from "express";
import { login, logoutAll, register } from "../controllers/auth.controller";
import { logout } from "../controllers/auth.controller";

const r = Router();

r.post("/login", login);
r.post("/register", register);
r.post("/logout-all", logoutAll);
r.post("/logout", logout);

export default r;

