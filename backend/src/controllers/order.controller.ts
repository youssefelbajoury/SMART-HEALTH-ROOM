import { Request, Response } from "express";
import { OrderService } from "../services/order.service.js";
import { EMAIL_REGEX, handleError } from "../utils/http.js";

// POST /api/v1/orders — public order intake
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dateOfBirth, email, phone, password } = req.body;

    if (!firstName || firstName.length < 2) {
      return res.status(400).json({ error: "First name must be at least 2 characters" });
    }
    if (!lastName || lastName.length < 2) {
      return res.status(400).json({ error: "Last name must be at least 2 characters" });
    }
    if (!dateOfBirth || Number.isNaN(new Date(dateOfBirth).getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const order = await OrderService.createOrder({ firstName, lastName, dateOfBirth, email, phone, password });
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    handleError(res, error, "Failed to place order");
  }
};

// GET /api/v1/orders/me — authenticated, own orders only
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    let orders = await OrderService.getMyOrders({
      email: req.user!.email,
      userId: req.user!.userId,
    });
    if (orders.length === 0) {
      orders = await OrderService.ensureOrderForUser(req.user!.userId);
    }
    res.json({ orders });
  } catch (error) {
    handleError(res, error, "Failed to fetch orders");
  }
};

// GET /api/v1/admin/orders
export const listOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const { search, status, sortBy, sortOrder, page, limit } = req.query;
    const result = await OrderService.listOrders({
      search: search as string,
      status: status as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to list orders");
  }
};

// GET /api/v1/admin/orders/stats
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const stats = await OrderService.getStats();
    res.json(stats);
  } catch (error) {
    handleError(res, error, "Failed to get order stats");
  }
};

// GET /api/v1/admin/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    res.json({ order });
  } catch (error) {
    handleError(res, error, "Failed to fetch order");
  }
};

// PATCH /api/v1/admin/orders/:id/accept
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.acceptOrder(req.params.id);
    res.json({ message: "Order accepted — processing automatically", order });
  } catch (error) {
    handleError(res, error, "Failed to accept order");
  }
};

// PATCH /api/v1/admin/orders/:id/reject
export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.rejectOrder(req.params.id);
    res.json({ message: "Order rejected", order });
  } catch (error) {
    handleError(res, error, "Failed to reject order");
  }
};
