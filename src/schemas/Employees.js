import mongoose from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: false },
    typeUser: { type: String, required: false },
    phoneNumber: { type: String, required: true },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

schema.add(AdminFields);

schema.plugin(autoIncrement, { model: "user", field: "userId", startAt: 1 });
const User = mongoose.model("user", schema);
export default User;
