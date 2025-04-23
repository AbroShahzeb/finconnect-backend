import { model, Schema, Document } from "mongoose";

interface IUser {
  name: string;
  email: string;
  image?: string;
  role?: "admin" | "developer";
  balance?: number;
}

export interface IUserDoc extends IUser, Document {}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lower: true,
  },
  role: {
    type: String,
    enum: ["developer", "admin"],
    default: "developer",
  },
  image: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const User = model<IUser>("User", userSchema);
export default User;
