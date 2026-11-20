// importation des modules nécessaires
import { Request, Response } from "express";
import { User } from "../models/User.js";
import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { LogService } from "../services/log.service.js";
import { AdminService } from "../services/admin.service.js";
import { EMAIL_REGEX } from "../utils/http.js";

// fonction pour générer les tokens JWT
const generateTokens = (payload: { userId: string; email: string }) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// POST /api/v1/auth/login - Connexion utilisateur
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account suspended" });
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    logger.info(`User logged in: ${email}`);
    await LogService.record(user._id.toString(), "success", "auth", "User Logged In");

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        dateNaissance: user.dateNaissance,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profileImage: user.profileImage,
        deviceId: user.deviceId,
      },
      tokens,
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// POST /api/v1/auth/register - Inscription utilisateur (self-service)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, firstName, dateOfBirth, phone, address } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Last name must be at least 2 characters" });
    }
    if (!firstName || firstName.trim().length < 2) {
      return res.status(400).json({ error: "First name must be at least 2 characters" });
    }

    // role and deviceId are never accepted from the request body — every
    // self-registered account is a plain "user" with no device pairing;
    // device pairing stays an admin-only action (AdminService.updateUser).
    const safeUser = await AdminService.createUser(
      { name, email, password, firstName, dateOfBirth, phone, address },
      { source: "auth", message: "User Registered" }
    );

    const tokens = generateTokens({
      userId: safeUser.id.toString(),
      email: safeUser.email,
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      message: "Registration successful",
      user: safeUser,
      tokens,
    });
  } catch (error: any) {
    if (error?.statusCode === 409) {
      return res.status(409).json({ error: "Email already exists" });
    }
    logger.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// GET /api/v1/auth/me - Profil utilisateur
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      dateNaissance: user.dateNaissance,
      phone: user.phone,
      address: user.address,
      role: user.role,
      profileImage: user.profileImage,
      deviceId: user.deviceId,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

// PATCH /api/v1/auth/profile - Modifier profil
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { nom, prenom, email, dateNaissance, phone, address } = req.body;

    // Validation
    // si nom est fourni et sa longueur est inférieure à 2, renvoyer une erreur
    if (nom && nom.length < 2) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters" });
    }
    if (prenom && prenom.length < 2) {
      return res
        .status(400)
        .json({ error: "First name must be at least 2 characters" });
    }
    // si email est fourni et n'est pas un email valide, renvoyer une erreur
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (dateNaissance && Number.isNaN(new Date(dateNaissance).getTime())) {
      return res.status(400).json({ error: "Invalid date of birth" });
    }
    // si email est fourni, vérifier s'il existe déjà pour un autre utilisateur

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    // si aucun champ n'est fourni, renvoyer une erreur
    if (!nom && !prenom && !email && !dateNaissance && !phone && !address) {
      return res
        .status(400)
        .json({ error: "At least one profile field must be provided" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // si tout est ok, mettre à jour le profil
    const updateData: any = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (email) updateData.email = email;
    if (dateNaissance) updateData.dateNaissance = new Date(dateNaissance);
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        dateNaissance: user.dateNaissance,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// PATCH /api/v1/auth/password - Changer mot de passe
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password required" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// PATCH /api/v1/auth/profile-image - Upload photo
export const updateProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data required" });
    }

    // Vérification taille (base64 ~33% plus grand que binaire)
    // 2MB = ~2.7MB base64
    if (imageBase64.length > 2.8 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large (max 2MB)" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profileImage: imageBase64 } },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Profile image updated for user: ${user.email}`);

    res.json({
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    logger.error("Update profile image error:", error);
    res.status(500).json({ error: "Failed to update profile image" });
  }
};

// DELETE /api/v1/auth/profile-image - Remove photo
export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profileImage: null } },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Profile image removed for user: ${user.email}`);

    res.json({ message: "Profile image removed successfully" });
  } catch (error) {
    logger.error("Delete profile image error:", error);
    res.status(500).json({ error: "Failed to delete profile image" });
  }
};
