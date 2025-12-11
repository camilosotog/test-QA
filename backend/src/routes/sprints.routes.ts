import { Router } from "express";
import { auth } from "../middlewares/auth";
import {
  createSprint,
  listSprints,
  getSprint,
  updateSprint,
  deleteSprint,
  getBoardsBySprint,
} from "../controllers/qaItems.controller";
import { getBoardsBySprintId } from "../controllers/boardsBySprint.controller";

const r = Router();
r.use(auth);

r.post("/", createSprint);
r.get("/", listSprints);
r.get("/boards", getBoardsBySprint);
r.get("/:sprintId/boards", getBoardsBySprintId);
r.get("/:id", getSprint);
r.put("/:id", updateSprint);
r.delete("/:id", deleteSprint);

export default r;
