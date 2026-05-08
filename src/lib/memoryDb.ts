/* eslint-disable */
import { Prompt } from "@prisma/client";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "prompts.json");

function readData(): Prompt[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveData(data: Prompt[]) {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export const memoryDb = {
  prompt: {
    findMany: async (args?: any) => {
      const data = readData();
      if (args?.orderBy?.createdAt === "desc") {
        return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return data;
    },
    findUnique: async (args?: any) => {
      const { where } = args || {};
      const data = readData();
      return data.find((p: any) => p.id === where?.id || p.slug === where?.slug) || null;
    },
    findFirst: async (args?: any) => {
      const data = readData();
      const now = new Date();
      return data.find((p: any) => p.enabled && new Date(p.nextExecutionAt) <= now) || null;
    },
    create: async (args?: any) => {
      const { data } = args || {};
      const allPrompts = readData();
      const newPrompt: Prompt = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        slug: data.slug,
        content: data.content,
        enabled: true,
        scheduleType: data.scheduleType,
        scheduleTime: data.scheduleTime,
        scheduleDays: data.scheduleDays || null,
        scheduleDate: data.scheduleDate || null,
        scheduleMonth: data.scheduleMonth || null,
        intervalValue: data.intervalValue || null,
        intervalUnit: data.intervalUnit || null,
        nextExecutionAt: data.nextExecutionAt || new Date(),
        lastExecutedAt: null,
        lastResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      allPrompts.push(newPrompt);
      saveData(allPrompts);
      return newPrompt;
    },
    update: async (args?: any) => {
      const { where, data } = args || {};
      const allPrompts = readData();
      const index = allPrompts.findIndex(p => p.id === where.id || p.slug === where.slug);
      if (index !== -1) {
        allPrompts[index] = { ...allPrompts[index], ...data, updatedAt: new Date() };
        saveData(allPrompts);
        return allPrompts[index];
      }
      throw new Error("Not found");
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const allPrompts = readData();
      const filtered = allPrompts.filter(p => p.id !== where.id);
      saveData(filtered);
    },
  },
  $transaction: async (items: any[]) => Promise.all(items),
};
