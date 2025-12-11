import { Router } from "express";
import {
  listReturns,
  getReturnById,
  createReturn,
  updateReturn,
  deleteReturn,
  getReturnsByDateRange,
  getStatisticsByPO,
  getStatisticsByMonth
} from "../controllers/return.controller";

const router = Router();

// Statistics routes (must come before parameterized routes)
router.get("/statistics/by-po", getStatisticsByPO);
router.get("/statistics/by-month", getStatisticsByMonth);
router.get("/date-range", getReturnsByDateRange);

// CRUD routes - order matters! Delete/Put before Get on params
router.post("/", createReturn);
router.delete("/:id", deleteReturn);
router.put("/:id", updateReturn);
router.get("/", listReturns);
router.get("/:id", getReturnById);

export default router;
