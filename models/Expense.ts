import { Schema, model, models, type InferSchemaType } from "mongoose";

const ExpenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rawText: { type: String, required: true },
    type: { type: String, enum: ["expense", "income"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export type Expense = InferSchemaType<typeof ExpenseSchema>;

export default models.Expense ?? model("Expense", ExpenseSchema);
