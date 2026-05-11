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

  let executionId: string | null = null;
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
    executionId = execution.id;

    // Worker en background con soporte para paralelismo y sincronización
    (async () => {
      const queue: { nodeId: string; lastOutput: string }[] = [];
      const trigger = workflow.nodes.find((n: any) => n.type.toLowerCase().includes("trigger"));
      if (trigger) queue.push({ nodeId: trigger.id, lastOutput: "Inicio de ejecución" });

      while (queue.length > 0) {
        const { nodeId, lastOutput } = queue.shift()!;
        const currentNode = workflow.nodes.find((n: any) => n.id === nodeId);
        if (!currentNode) continue;

        // Evitar procesar el mismo nodo varias veces (ej: cuando varios nodos van a un Converter)
        const alreadyProcessed = await db.executionStep.findFirst({
          where: { executionId: executionId!, nodeId: currentNode.id, status: "COMPLETED" }
        });
        if (alreadyProcessed) continue;

        const config = currentNode.config as any;

        // Si es un nodo de conversión (Converter), aplicar plantilla
        if (currentNode.type.toLowerCase().includes("converter") || currentNode.type.toLowerCase().includes("join")) {
          const incomingEdges = workflow.edges.filter((e: any) => e.targetNodeId === currentNode.id);
          const finishedSteps = await db.executionStep.findMany({
            where: { executionId: executionId!, status: "COMPLETED" }
          });
          
          const finishedNodeIds = finishedSteps.map((s: any) => s.nodeId);
          const allPredecessorsFinished = incomingEdges.every((e: any) => finishedNodeIds.includes(e.sourceNodeId));
          
          if (!allPredecessorsFinished) continue; // Esperar a otros inputs

          // Si todos terminaron, aplicamos la plantilla
          let finalOutput = config.template || "";
          console.log(` [CONVERTER] Aplicando plantilla: "${finalOutput}"`);
          
          for (const edge of incomingEdges) {
            const sourceNode = workflow.nodes.find((n: any) => n.id === edge.sourceNodeId);
            const step = finishedSteps.find((s: any) => s.nodeId === edge.sourceNodeId);
            if (sourceNode && step) {
              const nodeName = sourceNode.name || sourceNode.type;
              const tag = `{{${nodeName}}}`;
              const replacement = step.output || "";
              console.log(` [CONVERTER] Reemplazando tag ${tag} por contenido (${replacement.length} chars)`);
              finalOutput = finalOutput.split(tag).join(replacement);
            }
          }

          // Si la plantilla está vacía, hacemos el join por defecto
          if (!config.template || finalOutput.trim() === "") {
            console.log(` [CONVERTER] Plantilla vacía o sin tags, aplicando concatenación por defecto.`);
            finalOutput = incomingEdges.map((e: any) => finishedSteps.find((s: any) => s.nodeId === e.sourceNodeId)?.output || "").join("\n\n");
          }

          console.log(` [CONVERTER] Output final: ${finalOutput.substring(0, 50)}...`);

          await db.executionStep.create({ data: { executionId: executionId!, nodeId: currentNode.id, status: "RUNNING" } });
          const step = await db.executionStep.findFirst({ where: { executionId: executionId!, nodeId: currentNode.id }, orderBy: { createdAt: 'desc' } });
          await db.executionStep.update({
            where: { id: step!.id },
            data: { status: "COMPLETED", output: finalOutput, finishedAt: new Date() }
          });

          // Buscar siguientes nodos
          const outgoingEdges = workflow.edges.filter((e: any) => e.sourceNodeId === currentNode.id);
          outgoingEdges.forEach((edge: any) => {
            queue.push({ nodeId: edge.targetNodeId, lastOutput: finalOutput });
          });
          continue;
        }

        const step = await db.executionStep.create({
          data: { executionId: executionId!, nodeId: currentNode.id, status: "RUNNING" }
        });

        try {
          let output = "";

          if (currentNode.type.toLowerCase().includes("gemini") || currentNode.type.toLowerCase() === "ai") {
            const prompt = config.prompt.split("{{output}}").join(lastOutput);
            let aiModel = config.aiModel || 'default';
            
            // Lógica de Default: Si es 'default', usamos el del sistema
            if (aiModel === 'default') {
              aiModel = settings.AI_DEFAULT_MODEL || 'gemini';
            }

            if (config?.mockEnabled) {
              output = config.mockResponse || "Respuesta AI mockeada";
            } else if (aiModel === 'groq') {
              if (!settings.GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada en Ajustes.");
              console.log(` [GROQ] Llamando a llama-3.3-70b-versatile...`);
              const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.GROQ_API_KEY}` },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages: [{ role: "user", content: prompt }]
                })
              });
              const json = await res.json();
              if (json.error) throw new Error(`Groq API Error: ${JSON.stringify(json.error)}`);
              output = json.choices[0].message.content;
            } else if (aiModel === 'deepseek') {
              if (!settings.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY no configurada en Ajustes.");
              console.log(` [DEEPSEEK] Llamando a deepseek-chat...`);
              const res = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.DEEPSEEK_API_KEY}` },
                body: JSON.stringify({
                  model: "deepseek-chat",
                  messages: [{ role: "user", content: prompt }]
                })
              });
              const json = await res.json();
              if (json.error) {
                const errorMsg = typeof json.error === 'string' ? json.error : (json.error.message || JSON.stringify(json.error));
                throw new Error(`DeepSeek Error: ${errorMsg}`);
              }
              output = json.choices[0].message.content;
            } else if (aiModel === 'opencode') {
              if (!settings.OPENCODE_API_KEY) throw new Error("OPENCODE_API_KEY no configurada en Ajustes.");
              const model = config.opencodeModel || "big-pickle";
              console.log(` [OPENCODE] Llamando a ${model}...`);
              const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.OPENCODE_API_KEY}` },
                body: JSON.stringify({
                  model: model,
                  messages: [{ role: "user", content: prompt }]
                })
              });
              const json = await res.json();
              if (json.error) {
                const errorMsg = typeof json.error === 'string' ? json.error : (json.error.message || JSON.stringify(json.error));
                throw new Error(`OpenCode Error: ${errorMsg}`);
              }
              output = json.choices[0].message.content;
            } else {
              if (!settings.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada en Ajustes.");
              console.log(` [GEMINI] Llamando a gemini-2.0-flash (v1beta)...`);
              const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-goog-api-key": settings.GEMINI_API_KEY },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
              });
              const json = await res.json();
              if (json.error) throw new Error(`API Error ${json.error.code}: ${JSON.stringify(json.error)}`);
              output = json.candidates[0].content.parts[0].text;
            }
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
            if (config?.mockEnabled) {
              output = config.mockResponse || `[MOCK] Email enviado a ${config.to}`;
            } else {
              if (!settings.SMTP_HOST || !settings.SMTP_USER || !settings.SMTP_PASS) {
                throw new Error("Configuración SMTP incompleta en Ajustes.");
              }
              const transporter = nodemailer.createTransport({
                host: settings.SMTP_HOST,
                port: parseInt(settings.SMTP_PORT || "587"),
                secure: settings.SMTP_PORT === "465",
                auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASS }
              });

              const replaceVars = (text: string) => {
                if (!text) return "";
                return text
                  .split("{{output}}").join(lastOutput)
                  .split("{{fecha}}").join(new Date().toLocaleDateString())
                  .split("{{fecha_hora}}").join(new Date().toLocaleString())
                  .split("{{workflow_name}}").join(workflow.name);
              };

              const subject = replaceVars(config.subject || "Workflow Notification");
              const body = replaceVars(config.body || lastOutput);

              await transporter.sendMail({
                from: `"AgentMesh" <${settings.SMTP_USER}>`,
                to: config.to,
                subject: subject,
                html: body.replace(/\n/g, "<br>"),
              });
              output = `Email enviado con éxito a ${config.to}`;
            }
          } else if (currentNode.type.toLowerCase().includes("trigger")) {
            output = lastOutput;
          } else if (currentNode.type.toLowerCase().includes("workflow")) {
            if (config.subWorkflowId) {
              const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/workflows/${config.subWorkflowId}/execute`, { method: "POST" });
              const json = await res.json();
              output = `Sub-Workflow ejecutado: ${json.executionId}`;
            } else {
              output = "No hay sub-workflow configurado";
            }
          } else if (currentNode.type.toLowerCase().includes("debug")) {
            await db.executionStep.update({
              where: { id: step.id },
              data: { status: "WAITING", output: lastOutput }
            });

            let confirmed = false;
            while (!confirmed) {
              await new Promise(r => setTimeout(r, 1000));
              const currentStep = await db.executionStep.findUnique({ where: { id: step.id } });
              if (currentStep?.status === "COMPLETED") {
                confirmed = true;
                output = lastOutput;
              }
            }
          }

          await db.executionStep.update({
            where: { id: step.id },
            data: { status: "COMPLETED", output, finishedAt: new Date() }
          });

          const outgoingEdges = workflow.edges.filter((e: any) => e.sourceNodeId === currentNode.id);
          outgoingEdges.forEach((edge: any) => {
            queue.push({ nodeId: edge.targetNodeId, lastOutput: output });
          });

        } catch (error: any) {
          await db.executionStep.update({
            where: { id: step.id },
            data: { status: "FAILED", output: `Error: ${error.message}`, finishedAt: new Date() }
          });
          if (executionId) {
            await db.workflowExecution.update({
              where: { id: executionId },
              data: { status: "FAILED" }
            });
          }
          return;
        }
      }

      if (executionId) {
        await db.workflowExecution.update({
          where: { id: executionId },
          data: { status: "COMPLETED" }
        });
      }
    })();

    return NextResponse.json({ success: true, executionId: executionId });
  } catch (error: any) {
    console.error(error);
    if (executionId) {
      try {
        await db.workflowExecution.update({
          where: { id: executionId },
          data: { status: "FAILED" }
        });
      } catch (dbErr) { console.error("Error updating execution status to FAILED", dbErr); }
    }
    
    return NextResponse.json({ success: false, error: error.message });
  }
}
