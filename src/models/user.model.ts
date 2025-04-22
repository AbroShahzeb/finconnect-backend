import { model, Schema, Document } from "mongoose";

interface IUser {
  name: string;
  email: string;
  image?: string;
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

  image: {
    type: String,
  },
});

const User = model<IUser>("User", userSchema);
export default User;
