import mongoose from "mongoose";
import { model, Schema, Types } from "mongoose";

const AdminFieldsSchema = new mongoose.Schema({
  createdAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
});

module.exports = AdminFieldsSchema;
