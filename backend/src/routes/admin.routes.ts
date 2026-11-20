import { Router } from "express";
import {
  listUsers,
  getStats,
  createUser,
  updateUser,
  deleteUser,
  setSuspended,
  resetPassword,
  getAllLatestSensorData,
  getAllEmergencies,
  getDevices,
} from "../controllers/admin.controller.js";
import {
  listOrdersAdmin,
  getOrderStats,
  getOrderById,
  acceptOrder,
  rejectOrder,
} from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

// Every route in this file is admin-only
router.use(authenticate, requireRole("admin"));

router.get("/stats", getStats);

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/suspend", setSuspended);
router.patch("/users/:id/reset-password", resetPassword);

router.get("/sensors/latest", getAllLatestSensorData);
router.get("/emergencies", getAllEmergencies);
router.get("/devices", getDevices);

router.get("/orders", listOrdersAdmin);
router.get("/orders/stats", getOrderStats);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/accept", acceptOrder);
router.patch("/orders/:id/reject", rejectOrder);

export default router;
