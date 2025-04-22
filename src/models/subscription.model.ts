import { model, Schema, Types, Document } from "mongoose";

export interface ISubscription {
  name: string;
  price: number;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  paymentMethod?: string;
  status?: "active" | "cancelled" | "expired";
  startDate?: Date;
  renewalDate?: Date;
  userId: Types.ObjectId;
  subscriptionId: string; // New field
  customerId: string; // New field
}

export interface ISubscriptionDoc extends ISubscription, Document {}

const subscriptionSchema = new Schema<ISubscription>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: String,
      required: true, // New field
    },
    customerId: {
      type: String,
      required: true, // New field
    },
  },
  { timestamps: true }
);

const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;
