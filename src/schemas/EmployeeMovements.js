import mongoose from "mongoose";
import { model, Schema, Types } from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "employees", required: true },
    month: { type: Number, required: true },
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
