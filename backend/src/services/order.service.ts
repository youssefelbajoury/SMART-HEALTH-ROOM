import crypto from "crypto";
import { Order, IOrder, OrderStatus } from "../models/Order.js";
import { User } from "../models/User.js";
import { broadcastToUser } from "./websocket.service.js";
import { LogService } from "./log.service.js";
import { logger } from "../utils/logger.js";

export interface ListOrdersOptions {
  search?: string;
  status?: OrderStatus;
  sortBy?: "firstName" | "lastName" | "email" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

function toSafeOrder(order: IOrder) {
  return {
    id: order._id,
    firstName: order.firstName,
    lastName: order.lastName,
    dateOfBirth: order.dateOfBirth,
    email: order.email,
    phone: order.phone,
    status: order.status,
    userId: order.userId,
    timeline: order.timeline,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

// pending -> accepted (admin) -> processing (automatic, ~2s) -> delivered (automatic, ~2.5s, creates User)
// pending | accepted | processing -> rejected (admin, at any point before delivery)
const ACCEPTED_TO_PROCESSING_MS = 2000;
const PROCESSING_TO_DELIVERED_MS = 2500;

export interface OrderStatusChangePayload {
  order: ReturnType<typeof toSafeOrder>;
  event: OrderStatus;
  error?: string;
  userCreated?: boolean;
}

export class OrderService {
  static async createOrder(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const { firstName, lastName, dateOfBirth, email, phone, password } = data;

    const existingOrder = await Order.findOne({
      email,
      status: { $in: ["pending", "accepted", "processing"] },
    });
    if (existingOrder) {
      const err: any = new Error("An order for this email is already being reviewed");
      err.statusCode = 409;
      throw err;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err: any = new Error("Email already exists");
      err.statusCode = 409;
      throw err;
    }

    const order = await Order.create({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      email,
      phone,
      password,
      status: "pending",
      timeline: [{ status: "pending", at: new Date() }],
    });

    logger.info(`New order created: ${email}`);

    const admins = await User.find({ role: "admin" }).select("_id");
    const safeOrder = toSafeOrder(order);
    for (const admin of admins) {
      broadcastToUser(admin._id.toString(), "order:created", { order: safeOrder });
      LogService.record(admin._id.toString(), "info", "order", `New Order: ${firstName} ${lastName}`);
    }

    return safeOrder;
  }

  static async listOrders(options: ListOrdersOptions) {
    const {
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = options;

    const query: Record<string, any> = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }
    if (status) query.status = status;

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map(toSafeOrder),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getStats() {
    const [total, pending, accepted, processing, delivered, rejected, deliveryFailed] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "accepted" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "rejected" }),
      Order.countDocuments({ status: "delivery-failed" }),
    ]);
    return { total, pending, accepted, processing, delivered, rejected, deliveryFailed };
  }

  static async getOrderById(id: string) {
    const order = await Order.findById(id);
    if (!order) {
      const err: any = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    return toSafeOrder(order);
  }

  static async getMyOrders(filter: { email?: string; userId?: string }) {
    const or: Record<string, any>[] = [];
    if (filter.email) or.push({ email: filter.email });
    if (filter.userId) or.push({ userId: filter.userId });
    if (or.length === 0) return [];

    const orders = await Order.find({ $or: or }).sort({ createdAt: -1 });
    return orders.map(toSafeOrder);
  }

  /**
   * Backfills a Delivered order for accounts that exist without one — e.g. a
   * user created directly by an admin (AdminService.createUser) rather than
   * through the public order-intake flow. Reuses the real Order model/schema
   * so "My Order" always has a genuine Mongo record to show instead of an
   * empty state, without touching accounts that already have real orders.
   */
  static async ensureOrderForUser(userId: string) {
    const existing = await this.getMyOrders({ userId });
    if (existing.length > 0) return existing;

    const user = await User.findById(userId);
    if (!user) return [];

    const alreadyOrderedByEmail = await Order.findOne({ email: user.email });
    if (alreadyOrderedByEmail) {
      if (!alreadyOrderedByEmail.userId) {
        alreadyOrderedByEmail.userId = user._id as any;
        await alreadyOrderedByEmail.save();
      }
      return [toSafeOrder(alreadyOrderedByEmail)];
    }

    const placedAt = user.createdAt ?? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const acceptedAt = new Date(placedAt.getTime() + 2 * 60 * 1000);
    const processingAt = new Date(acceptedAt.getTime() + ACCEPTED_TO_PROCESSING_MS);
    const deliveredAt = new Date(processingAt.getTime() + PROCESSING_TO_DELIVERED_MS);

    const order = await Order.create({
      firstName: user.prenom,
      lastName: user.nom,
      dateOfBirth: user.dateNaissance,
      email: user.email,
      phone: user.phone,
      password: crypto.randomBytes(24).toString("hex"),
      status: "delivered",
      userId: user._id,
      createdAt: placedAt,
      updatedAt: deliveredAt,
      timeline: [
        { status: "pending", at: placedAt },
        { status: "accepted", at: acceptedAt },
        { status: "processing", at: processingAt },
        { status: "delivered", at: deliveredAt },
      ],
    });

    logger.info(`Backfilled Delivered order for existing account: ${user.email}`);
    return [toSafeOrder(order)];
  }

  static async acceptOrder(id: string) {
    const order = await Order.findById(id);
    if (!order) {
      const err: any = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.status !== "pending") {
      const err: any = new Error(`Cannot accept an order with status "${order.status}"`);
      err.statusCode = 400;
      throw err;
    }

    order.status = "accepted";
    order.timeline.push({ status: "accepted", at: new Date() });
    await order.save();
    logger.info(`Order ${order.email} -> accepted`);

    await this.broadcastStatusChange(order, "accepted");
    this.scheduleAutoProgress(order._id.toString());

    return toSafeOrder(order);
  }

  static async rejectOrder(id: string) {
    const order = await Order.findById(id);
    if (!order) {
      const err: any = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (!["pending", "accepted", "processing"].includes(order.status)) {
      const err: any = new Error(`Cannot reject an order with status "${order.status}"`);
      err.statusCode = 400;
      throw err;
    }

    order.status = "rejected";
    order.timeline.push({ status: "rejected", at: new Date() });
    await order.save();
    logger.info(`Order ${order.email} -> rejected`);

    await this.broadcastStatusChange(order, "rejected");
    return toSafeOrder(order);
  }

  /**
   * Fire-and-forget: after Accept, the order advances itself through
   * Processing -> Delivered on a timer, with no further admin action.
   * Each step re-checks the order is still in the expected prior status
   * before acting, so a Reject during the window silently cancels the
   * rest of the cascade instead of requiring a real timer handle.
   */
  private static scheduleAutoProgress(orderId: string) {
    setTimeout(async () => {
      try {
        const order = await Order.findById(orderId);
        if (!order || order.status !== "accepted") return;

        order.status = "processing";
        order.timeline.push({ status: "processing", at: new Date() });
        await order.save();
        logger.info(`Order ${order.email} -> processing (auto)`);
        await this.broadcastStatusChange(order, "processing");

        setTimeout(() => {
          this.autoDeliver(orderId).catch((error) =>
            logger.error("Auto-deliver failed:", error)
          );
        }, PROCESSING_TO_DELIVERED_MS);
      } catch (error) {
        logger.error("Auto-progress (processing) failed:", error);
      }
    }, ACCEPTED_TO_PROCESSING_MS);
  }

  private static async autoDeliver(orderId: string) {
    const order = await Order.findById(orderId).select("+password");
    if (!order || order.status !== "processing") return;

    const existingUser = await User.findOne({ email: order.email });
    if (existingUser) {
      logger.warn(`Auto-delivery blocked — email already exists: ${order.email}`);
      order.status = "delivery-failed";
      order.timeline.push({ status: "delivery-failed", at: new Date(), note: "Email already exists" });
      await order.save();
      await this.broadcastStatusChange(order, "delivery-failed", "Email already exists");
      return;
    }

    const user = new User({
      nom: order.lastName,
      prenom: order.firstName,
      dateNaissance: order.dateOfBirth,
      email: order.email,
      phone: order.phone,
      role: "user",
    });
    user.password = order.password; // already bcrypt-hashed by Order's pre('save') hook
    user.$locals.skipHash = true;
    await user.save();

    order.userId = user._id as any;
    order.status = "delivered";
    order.timeline.push({ status: "delivered", at: new Date() });
    await order.save();

    logger.info(`Order ${order.email} -> delivered (auto) — user created`);
    LogService.record(user._id.toString(), "success", "order", "Order Delivered — Account Created");
    await this.broadcastStatusChange(order, "delivered", undefined, true);
  }

  private static async broadcastStatusChange(
    order: IOrder,
    event: OrderStatus,
    error?: string,
    userCreated?: boolean
  ) {
    const admins = await User.find({ role: "admin" }).select("_id");
    const payload: OrderStatusChangePayload = { order: toSafeOrder(order), event, error, userCreated };
    const label = `${order.firstName} ${order.lastName}`;
    for (const admin of admins) {
      broadcastToUser(admin._id.toString(), "order:status-changed", payload);
      LogService.record(admin._id.toString(), event === "delivery-failed" ? "error" : "info", "order", `Order ${event}: ${label}`);
    }
  }
}
