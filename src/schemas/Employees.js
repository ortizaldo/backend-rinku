import mongoose from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    employeeNumber: { type: Number, required: true },
    employeeRol: {
      type: String,
      enum: ["chofer", "cargador", "auxiliar"],
      default: "chofer",
    },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

schema.add(AdminFields);

schema.plugin(autoIncrement, {
  model: "employees",
  field: "employeeID",
  startAt: 1,
});
const Employees = mongoose.model("employees", schema);
export default Employees;
