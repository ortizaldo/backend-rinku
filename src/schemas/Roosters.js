import { model, Schema, Types } from "mongoose";
import mongoose from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: "team",
      required: true,
    },
    ringNumber: { type: Number, required: true },
    roosterWeight: { type: Number, required: true },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

schema.add(AdminFields);

schema.plugin(autoIncrement, "roosters");

const roosters = mongoose.model("roosters", schema);
export default roosters;
