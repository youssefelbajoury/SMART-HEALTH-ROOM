import { Router } from "express";
import { receiveBedEvent } from "../controllers/bed.controller.js";

const router = Router();

router.post("/", receiveBedEvent);

export default router;
