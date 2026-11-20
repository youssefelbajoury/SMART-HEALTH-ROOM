import { Router } from "express";
import { createOrder, getMyOrders } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public — placing an order is not gated behind login
router.post("/", createOrder);

router.get("/me", authenticate, getMyOrders);

export default router;
