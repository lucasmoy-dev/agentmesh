import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";

async function getSettings() {
  const settings = await db.systemSetting.findMany();
  const config: Record<string, string> = {};
  settings.forEach((s: any) => { config[s.key] = s.value; });
  return config;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const settings = await getSettings();
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: { nodes: true, edges: true }
    });

    if (!workflow) return NextResponse.json({ success: false, error: "Workflow no encontrado" }, { status: 404 });

    const execution = await db.workflowExecution.create({
      data: { workflowId: id, status: "RUNNING" }
    });

    // Worker en background
    (async () => {
      let currentNode: any = workflow.nodes.find((n: any) => n.type.toLowerCase().includes("trigger"));
      let lastOutput = "Inicio de ejecución";

      while (currentNode) {
        const config = currentNode.config as any;

        const step = await db.executionStep.create({
          data: { executionId: execution.id, nodeId: currentNode.id, status: "RUNNING" }
        });

        try {
          let output = "";

          if (config?.mockEnabled) {
            output = config.mockResponse || "Respuesta mockeada vacía";
          } else {
            if (currentNode.type.toLowerCase().includes("gemini")) {
              const prompt = config.prompt.replace("{{output}}", lastOutput);
              console.log(` [GEMINI] Llamando a gemini-3-flash-preview (v1beta)...`);
              const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-goog-api-key": settings.GEMINI_API_KEY },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
              });
              const json = await res.json();
              if (json.error) throw new Error(`API Error ${json.error.code}: ${JSON.stringify(json.error)}`);
              output = json.candidates[0].content.parts[0].text;
            } else if (currentNode.type.toLowerCase().includes("storage")) {
              const label = config.label || "default";
              if (!config.mockEnabled) {
                await db.storedData.upsert({
                  where: { label },
                  update: { content: lastOutput, updatedAt: new Date() },
                  create: { label, content: lastOutput }
                });
              }
              output = lastOutput;
            } else if (currentNode.type.toLowerCase().includes("email")) {
              if (!settings.SMTP_HOST || !settings.SMTP_USER || !settings.SMTP_PASS) {
                throw new Error("Configuración SMTP incompleta en Ajustes.");
              }
              const transporter = nodemailer.createTransport({
                host: settings.SMTP_HOST,
                port: parseInt(settings.SMTP_PORT || "587"),
                secure: settings.SMTP_PORT === "465",
                auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASS }
              });

              const now = new Date();
              const dateStr = now.toLocaleDateString('es-ES');
              const dateTimeStr = now.toLocaleString('es-ES');
              
              let body = (config.body || "")
                .replace(/{{output}}/g, lastOutput)
                .replace(/{{fecha}}/g, dateStr)
                .replace(/{{fecha_hora}}/g, dateTimeStr)
                .replace(/{{workflow_name}}/g, workflow.name);

              await transporter.sendMail({
                from: settings.SMTP_FROM || settings.SMTP_USER,
                to: config.to,
                subject: config.subject || "AgentMesh Notification",
                text: body
              });
              output = `Email enviado con éxito a ${config.to}`;
            } else if (currentNode.type.toLowerCase().includes("trigger")) {
              output = "Trigger activado";
            }
          }

          lastOutput = output;
          await db.executionStep.update({
            where: { id: step.id },
            data: { status: "COMPLETED", output, finishedAt: new Date() }
          });

          const edge: any = workflow.edges.find((e: any) => e.sourceNodeId === currentNode?.id);
          currentNode = edge ? workflow.nodes.find((n: any) => n.id === edge.targetNodeId) : undefined;

        } catch (error: any) {
          await db.executionStep.update({
            where: { id: step.id },
            data: { status: "FAILED", output: `Error: ${error.message}`, finishedAt: new Date() }
          });
          await db.workflowExecution.update({
            where: { id: execution.id },
            data: { status: "FAILED" }
          });
          return;
        }
      }

      await db.workflowExecution.update({
        where: { id: execution.id },
        data: { status: "COMPLETED" }
      });
    })();

    return NextResponse.json({ success: true, executionId: execution.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
