import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY || "");
