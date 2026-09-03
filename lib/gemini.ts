import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["expense", "income"] },
    amount: { type: Type.NUMBER },
    category: { type: Type.STRING },
    description: { type: Type.STRING },
    date: { type: Type.STRING, description: "ISO 8601 date, e.g. 2026-09-03" },
  },
  required: ["type", "amount", "category", "date"],
};

export interface AnalyzedExpense {
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export async function analyzeExpenseText(text: string): Promise<AnalyzedExpense> {
  const today = new Date().toISOString().slice(0, 10);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `你是一個記帳助理。請分析以下使用者輸入的記帳文字，判斷這是一筆「支出(expense)」還是「收入(income)」，並萃取出金額、分類、簡短描述與日期。
今天的日期是 ${today}，若使用者沒有明確提到日期，請使用今天的日期。
分類請使用常見中文記帳分類（例如：餐飲、交通、購物、娛樂、居住、薪資、獎金、其他等）。

使用者輸入：「${text}」`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini did not return any content");
  }

  const parsed = JSON.parse(raw) as AnalyzedExpense;
  return parsed;
}
