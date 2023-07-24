import { model, Schema, Types } from "mongoose";
import mongoose from "mongoose";
import AdminFields from "schemas/definitions/AdminFields";
import { autoIncrement } from "mongoose-plugin-autoinc";

const schema = new mongoose.Schema(
  {
    derby: {
      type: Schema.Types.ObjectId,
      ref: "derby",
      required: true,
    },
    roosterConf: {
      numberRooster: { type: Number },
      tolerance: { type: Number },
      minWeight: { type: Number },
      maxWeight: { type: Number },
    },
    pointsConf: {
      winner: { type: Number },
      draw: { type: Number },
    },
    ringsConf: {
      digits: { type: Number },
      draw: { type: Number },
    },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

schema.add(AdminFields);

schema.plugin(autoIncrement, "derbyconf");

const derbyConf = mongoose.model("derbyconf", schema);
export default derbyConf;
