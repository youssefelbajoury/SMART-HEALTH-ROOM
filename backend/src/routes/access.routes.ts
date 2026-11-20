import { Router } from "express";
import { receiveAccessEvent } from "../controllers/access.controller.js";

const router = Router();

router.post("/", receiveAccessEvent);

export default router;
