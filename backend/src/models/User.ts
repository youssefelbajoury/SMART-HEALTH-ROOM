import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  nom: string;
  prenom: string; // ← AJOUTE CECI
  dateNaissance: Date; // ← AJOUTE CECI
  role: string; // ← AJOUTE CECI
  isActive: boolean;
  lastLogin?: Date;
  deviceId?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  nom: {
    type: String,
    required: true,
    minlength: 2,
    default: "Nom",
    maxlength: 50,
  }, // ← AJOUTE CECI
  prenom: {
    type: String,
    required: true,
    minlength: 2,
    default: "Prénom",
    maxlength: 50,
  }, // ← AJOUTE CECI
  dateNaissance: { type: Date, required: true, default: Date.now }, // ← AJOUTE CECI
  role: { type: String, enum: ["user", "admin"], default: "user" }, // ← AJOUTE CECI
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  deviceId: { type: String, sparse: true },
  profileImage: { type: String, default: null }, // ← AJOUTE CECI
  phone: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password avant sauvegarde
UserSchema.pre("save", async function () {
  const user = this as IUser;

  // $locals.skipHash lets OrderService copy an already-hashed password
  // (from a Delivered Order) into a new User without double-hashing it.
  if (!user.isModified("password") || user.$locals.skipHash) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(user.password, salt);
});

// Méthode pour comparer les passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
// Méthode statique pour trouver par deviceId
UserSchema.statics.findByDeviceId = function (deviceId: string) {
  return this.findOne({ deviceId });
};

// Méthode pour assigner un device
UserSchema.methods.assignDevice = async function (deviceId: string) {
  this.deviceId = deviceId;
  return this.save();
};

export const User = mongoose.model<IUser>("User", UserSchema);
