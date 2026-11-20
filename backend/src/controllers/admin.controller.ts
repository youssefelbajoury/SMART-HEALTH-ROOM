import { Request, Response } from "express";
import { AdminService } from "../services/admin.service.js";
import { handleError } from "../utils/http.js";

// GET /api/v1/admin/users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, status, sortBy, sortOrder, page, limit } = req.query;
    const result = await AdminService.listUsers({
      search: search as string,
      role: role as "user" | "admin" | undefined,
      status: status as "active" | "suspended" | undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to list users");
  }
};

// GET /api/v1/admin/stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getStats();
    res.json(stats);
  } catch (error) {
    handleError(res, error, "Failed to get stats");
  }
};

// POST /api/v1/admin/users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, firstName, dateOfBirth, phone, address, deviceId, profileImage } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (firstName && firstName.length < 2) {
      return res.status(400).json({ error: "First name must be at least 2 characters" });
    }
    if (dateOfBirth && Number.isNaN(new Date(dateOfBirth).getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }

    const user = await AdminService.createUser({
      name,
      email,
      password,
      role,
      firstName,
      dateOfBirth,
      phone,
      address,
      deviceId,
      profileImage,
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    handleError(res, error, "Failed to create user");
  }
};

// PATCH /api/v1/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, firstName, dateOfBirth, phone, address, deviceId, profileImage } = req.body;

    if (name && name.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }
    if (firstName && firstName.length < 2) {
      return res.status(400).json({ error: "First name must be at least 2 characters" });
    }
    if (dateOfBirth && Number.isNaN(new Date(dateOfBirth).getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }

    const user = await AdminService.updateUser(id, {
      name,
      email,
      role,
      firstName,
      dateOfBirth,
      phone,
      address,
      deviceId,
      profileImage,
    });
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    handleError(res, error, "Failed to update user");
  }
};

// DELETE /api/v1/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    await AdminService.deleteUser(id, req.user!.userId);
    res.json({ message: "User permanently deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete user");
  }
};

// PATCH /api/v1/admin/users/:id/suspend
export const setSuspended = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;

    if (id === req.user!.userId && suspended) {
      return res.status(400).json({ error: "You cannot suspend your own account" });
    }

    const user = await AdminService.setSuspended(id, !!suspended);
    res.json({ message: suspended ? "User suspended" : "User reactivated", user });
  } catch (error) {
    handleError(res, error, "Failed to update user status");
  }
};

// PATCH /api/v1/admin/users/:id/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    await AdminService.resetPassword(id, newPassword);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    handleError(res, error, "Failed to reset password");
  }
};

// GET /api/v1/admin/sensors/latest
export const getAllLatestSensorData = async (req: Request, res: Response) => {
  try {
    const data = await AdminService.listAllLatestSensorData();
    res.json({ data });
  } catch (error) {
    handleError(res, error, "Failed to fetch sensor data");
  }
};

// GET /api/v1/admin/emergencies
export const getAllEmergencies = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const result = await AdminService.listAllEmergencies({
      status: status as "active" | "resolved" | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch emergencies");
  }
};

// GET /api/v1/admin/devices
export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await AdminService.listDevices();
    res.json({ devices });
  } catch (error) {
    handleError(res, error, "Failed to fetch devices");
  }
};
