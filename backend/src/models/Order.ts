import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type OrderStatus = "pending" | "accepted" | "processing" | "delivered" | "rejected" | "delivery-failed";

export interface IOrderTimelineEntry {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  phone?: string;
  password: string;
  status: OrderStatus;
  userId?: Types.ObjectId;
  timeline: IOrderTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const OrderTimelineSchema = new Schema<IOrderTimelineEntry>(
  {
    status: {
      type: String,
      enum: ["pending", "accepted", "processing", "delivered", "rejected", "delivery-failed"],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>({
  firstName: { type: String, required: true, minlength: 2, maxlength: 50 },
  lastName: { type: String, required: true, minlength: 2, maxlength: 50 },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String, required: true, select: false },
  status: {
    type: String,
    enum: ["pending", "accepted", "processing", "delivered", "rejected"],
    default: "pending",
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  timeline: { type: [OrderTimelineSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password avant sauvegarde (même logique que User.ts)
OrderSchema.pre("save", async function () {
  const order = this as IOrder;

  if (!order.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  order.password = await bcrypt.hash(order.password, salt);
});

OrderSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
