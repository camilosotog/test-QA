import { Router } from "express";
import { auth } from "../middlewares/auth";
import { createItem, listItems } from "../controllers/items.controller";

const r = Router();
r.use(auth);

r.post("/", createItem);
r.get("/", listItems);

export default r;

