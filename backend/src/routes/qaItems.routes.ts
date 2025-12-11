import { Router } from "express";
import { auth } from "../middlewares/auth";
import {
  createQAItem,
  listQAItems,
  getQAItem,
  updateQAItem,
  deleteQAItem,
  checkDuplicateTask,
  getQAStatistics,
} from "../controllers/qaItems.controller";

const r = Router();
r.use(auth);

r.get("/", listQAItems);
r.get("/check-duplicate", checkDuplicateTask);
r.get("/statistics", getQAStatistics);
r.post("/", createQAItem);
r.get("/:id", getQAItem);
r.put("/:id", updateQAItem);
r.delete("/:id", deleteQAItem);

export default r;

