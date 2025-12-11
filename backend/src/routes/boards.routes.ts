import { Router } from "express";
import { auth } from "../middlewares/auth";
import { createBoard, listBoards } from "../controllers/boards.controller";

const r = Router();
r.use(auth);

r.post("/", createBoard);
r.get("/", listBoards);

export default r;
