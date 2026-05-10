/* eslint-disable */
import { Prompt } from "@prisma/client";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "db.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { prompts: [], workflows: [], nodes: [], edges: [], storedData: [], executions: [], executionSteps: [], systemSettings: [] };
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { prompts: [], workflows: [], nodes: [], edges: [], storedData: [], executions: [], executionSteps: [], systemSettings: [] };
  }
}

function saveData(data: any) {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export const memoryDb = {
  workflow: {
    findMany: async () => readData().workflows,
    findUnique: async (args: any) => {
      const data = readData();
      const wf = data.workflows.find((w: any) => w.id === args.where.id);
      if (wf) {
        wf.nodes = data.nodes.filter((n: any) => n.workflowId === wf.id);
        wf.edges = data.edges.filter((e: any) => e.workflowId === wf.id);
      }
      return wf;
    },
    update: async (args: any) => {
      const data = readData();
      const index = data.workflows.findIndex((w: any) => w.id === args.where.id);
      if (index !== -1) {
        data.workflows[index] = { ...data.workflows[index], ...args.data };
        saveData(data);
        return data.workflows[index];
      }
    },
    delete: async (args: any) => {
      const data = readData();
      data.workflows = data.workflows.filter((w: any) => w.id !== args.where.id);
      saveData(data);
    },
    create: async (args: any) => {
      const data = readData();
      const wf = { id: Math.random().toString(36).substr(2, 9), ...args.data, createdAt: new Date() };
      data.workflows.push(wf);
      saveData(data);
      return wf;
    }
  },
  node: {
    deleteMany: async () => {},
    createMany: async (args: any) => {
      const data = readData();
      data.nodes = [...data.nodes.filter((n: any) => n.workflowId !== args.data[0]?.workflowId), ...args.data];
      saveData(data);
    }
  },
  edge: {
    deleteMany: async () => {},
    createMany: async (args: any) => {
      const data = readData();
      data.edges = [...data.edges.filter((e: any) => e.workflowId !== args.data[0]?.workflowId), ...args.data];
      saveData(data);
    }
  },
  workflowExecution: {
    create: async (args: any) => {
      const data = readData();
      const execution = { id: Math.random().toString(36).substr(2, 9), status: "RUNNING", ...args.data, createdAt: new Date(), updatedAt: new Date() };
      data.executions.push(execution);
      saveData(data);
      return execution;
    },
    update: async (args: any) => {
      const data = readData();
      const index = data.executions.findIndex((e: any) => e.id === args.where.id);
      if (index !== -1) {
        data.executions[index] = { ...data.executions[index], ...args.data, updatedAt: new Date() };
        saveData(data);
        return data.executions[index];
      }
      return {};
    },
    findUnique: async (args: any) => {
      const data = readData();
      const execution = data.executions.find((e: any) => e.id === args.where.id);
      if (execution) {
        execution.steps = data.executionSteps.filter((s: any) => s.executionId === execution.id);
      }
      return execution;
    }
  },
  executionStep: {
    create: async (args: any) => {
      const data = readData();
      const step = { id: Math.random().toString(36).substr(2, 9), ...args.data, createdAt: new Date() };
      data.executionSteps.push(step);
      saveData(data);
      return step;
    },
    update: async (args: any) => {
      const data = readData();
      const index = data.executionSteps.findIndex((s: any) => s.id === args.where.id);
      if (index !== -1) {
        data.executionSteps[index] = { ...data.executionSteps[index], ...args.data };
        saveData(data);
      }
      return {};
    },
    upsert: async (args: any) => {
      const data = readData();
      const index = data.executionSteps.findIndex((s: any) => s.executionId === args.where.executionId_nodeId?.executionId && s.nodeId === args.where.executionId_nodeId?.nodeId);
      if (index !== -1) {
        data.executionSteps[index] = { ...data.executionSteps[index], ...args.update };
      } else {
        data.executionSteps.push({ id: Math.random().toString(36).substr(2, 9), ...args.create, createdAt: new Date() });
      }
      saveData(data);
      return {};
    }
  },
  storedData: {
    upsert: async (args: any) => {
      const data = readData();
      const index = data.storedData.findIndex((s: any) => s.label === args.where.label);
      if (index !== -1) {
        data.storedData[index] = { ...data.storedData[index], ...args.update };
      } else {
        data.storedData.push({ id: Math.random().toString(), ...args.create });
      }
      saveData(data);
      return {};
    },
    findMany: async () => readData().storedData,
    findUnique: async (args: any) => {
      const data = readData();
      return data.storedData.find((s: any) => s.label === args.where.label || s.id === args.where.id);
    },
    delete: async (args: any) => {
      const data = readData();
      data.storedData = data.storedData.filter((s: any) => s.id !== args.where.id);
      saveData(data);
    },
    update: async (args: any) => {
      const data = readData();
      const index = data.storedData.findIndex((s: any) => s.id === args.where.id);
      if (index !== -1) {
        data.storedData[index] = { ...data.storedData[index], ...args.data };
        saveData(data);
      }
    }
  },
  systemSetting: {
    findMany: async () => readData().systemSettings,
    upsert: async (args: any) => {
      const data = readData();
      const index = data.systemSettings.findIndex((s: any) => s.key === args.where.key);
      if (index !== -1) {
        data.systemSettings[index] = { ...data.systemSettings[index], ...args.update };
      } else {
        data.systemSettings.push({ id: Math.random().toString(), ...args.create });
      }
      saveData(data);
      return {};
    }
  },
  $transaction: async (items: any[]) => Promise.all(items),
  prompt: {
    findMany: async () => readData().prompts,
    findFirst: async () => null,
  }
};
