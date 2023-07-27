import mongoose from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    employee: { type: String, required: true },
    month: { type: String, required: true },
    numberDeliveries: { type: Number, required: true },
    numberHours: { type: Number, required: true },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

schema.add(AdminFields);

schema.plugin(autoIncrement, {
  model: "employeeMovements",
  field: "movementId",
  startAt: 1,
});
const EmployeeMovements = mongoose.model("employeeMovements", schema);
export default EmployeeMovements;
