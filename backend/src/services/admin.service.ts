import { User, IUser } from "../models/User.js";
import { SensorData } from "../models/SensorData.js";
import { Emergency } from "../models/Emergency.js";
import { LogService } from "./log.service.js";
import { logger } from "../utils/logger.js";

export interface ListUsersOptions {
  search?: string;
  role?: "user" | "admin";
  status?: "active" | "suspended";
  sortBy?: "nom" | "email" | "createdAt" | "lastLogin";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

function toSafeUser(user: IUser) {
  return {
    id: user._id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    dateNaissance: user.dateNaissance,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    profileImage: user.profileImage,
    deviceId: user.deviceId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AdminService {
  static async listUsers(options: ListUsersOptions) {
    const {
      search,
      role,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = options;

    const query: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ nom: regex }, { email: regex }];
    }
    if (role) query.role = role;
    // isActive defaults to true and may be absent on documents created before this field existed —
    // match on $ne rather than a strict boolean so legacy users aren't miscounted as suspended.
    if (status) query.isActive = status === "active" ? { $ne: false } : false;

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users: users.map(toSafeUser),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  static async getStats() {
    const [total, admins, active, suspended] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),
    ]);
    return { total, admins, active, suspended };
  }

  static async createUser(
    data: {
      name: string;
      email: string;
      password: string;
      role?: "user" | "admin";
      firstName?: string;
      dateOfBirth?: string;
      phone?: string;
      address?: string;
      deviceId?: string;
      profileImage?: string;
    },
    // Lets self-registration (auth.controller.ts#register) reuse this exact
    // creation path with an accurate audit-log entry, instead of duplicating
    // User.create()'s validation/hashing/mapping logic in the auth controller.
    logOptions: { source?: string; message?: string } = {}
  ) {
    const { name, email, password, role, firstName, dateOfBirth, phone, address, deviceId, profileImage } = data;
    const { source = "admin", message = "Account Created by Administrator" } = logOptions;

    const existing = await User.findOne({ email });
    if (existing) {
      const err: any = new Error("Email already exists");
      err.statusCode = 409;
      throw err;
    }

    const user = await User.create({
      nom: name,
      prenom: firstName,
      dateNaissance: dateOfBirth ? new Date(dateOfBirth) : undefined,
      phone,
      address,
      deviceId: deviceId || undefined,
      profileImage,
      email,
      password,
      role: role === "admin" ? "admin" : "user",
    });

    logger.info(`User created: ${email} (role: ${user.role})`);
    LogService.record(user._id.toString(), "success", source, message);
    return toSafeUser(user);
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: "user" | "admin";
      firstName?: string;
      dateOfBirth?: string;
      phone?: string;
      address?: string;
      deviceId?: string;
      profileImage?: string;
    }
  ) {
    const { name, email, role, firstName, dateOfBirth, phone, address, deviceId, profileImage } = data;

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        const err: any = new Error("Email already exists");
        err.statusCode = 409;
        throw err;
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name) updateData.nom = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (firstName) updateData.prenom = firstName;
    if (dateOfBirth) updateData.dateNaissance = new Date(dateOfBirth);
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (deviceId !== undefined) updateData.deviceId = deviceId || undefined;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    logger.info(`Admin updated user: ${user.email}`);
    LogService.record(user._id.toString(), "info", "admin", "Account Updated by Administrator");
    return toSafeUser(user);
  }

  static async deleteUser(id: string, actorId: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    logger.info(`Admin permanently deleted user: ${user.email}`);
    LogService.record(actorId, "warning", "admin", `Deleted User Account: ${user.email}`);
  }

  static async setSuspended(id: string, suspended: boolean) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: !suspended, updatedAt: new Date() } },
      { new: true }
    );
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    logger.info(`Admin ${suspended ? "suspended" : "reactivated"} user: ${user.email}`);
    LogService.record(user._id.toString(), suspended ? "warning" : "success", "admin", suspended ? "Account Suspended by Administrator" : "Account Reactivated by Administrator");
    return toSafeUser(user);
  }

  static async resetPassword(id: string, newPassword: string) {
    const user = await User.findById(id);
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    user.password = newPassword;
    await user.save();
    logger.info(`Admin reset password for user: ${user.email}`);
    LogService.record(user._id.toString(), "info", "admin", "Password Reset by Administrator");
  }

  static async listAllLatestSensorData() {
    const results = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          deviceId: 1,
          userId: 1,
          userName: "$user.nom",
          userEmail: "$user.email",
          temperature: 1,
          humidity: 1,
          airQuality: 1,
          gas: 1,
          light: 1,
          soundLevel: 1,
          motion: 1,
          sleepScore: 1,
          timestamp: 1,
        },
      },
      { $sort: { timestamp: -1 } },
    ]);
    return results;
  }

  static async listAllEmergencies(options: { status?: "active" | "resolved"; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = options;
    const query: Record<string, any> = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [emergencies, total] = await Promise.all([
      Emergency.find(query)
        .populate("userId", "nom email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Emergency.countDocuments(query),
    ]);

    return {
      emergencies,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  static async listDevices() {
    const users = await User.find({ deviceId: { $exists: true, $ne: null } }).select(
      "nom email deviceId isActive"
    );
    return users.map((u) => ({
      userId: u._id,
      userName: u.nom,
      userEmail: u.email,
      deviceId: u.deviceId,
      userActive: u.isActive,
    }));
  }
}
