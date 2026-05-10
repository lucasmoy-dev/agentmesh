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
          where: { executionId: execution.id, nodeId: currentNode.id, status: "COMPLETED" }
        });
        if (alreadyProcessed) continue;

        const config = currentNode.config as any;

        // Si es un nodo de conversión (Converter), aplicar plantilla
        if (currentNode.type.toLowerCase().includes("converter") || currentNode.type.toLowerCase().includes("join")) {
          const incomingEdges = workflow.edges.filter((e: any) => e.targetNodeId === currentNode.id);
          const finishedSteps = await db.executionStep.findMany({
            where: { executionId: execution.id, status: "COMPLETED" }
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

          await db.executionStep.create({ data: { executionId: execution.id, nodeId: currentNode.id, status: "RUNNING" } });
          const step = await db.executionStep.findFirst({ where: { executionId: execution.id, nodeId: currentNode.id }, orderBy: { createdAt: 'desc' } });
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
          data: { executionId: execution.id, nodeId: currentNode.id, status: "RUNNING" }
        });

        try {
          let output = "";

          if (currentNode.type.toLowerCase().includes("gemini")) {
            if (config?.mockEnabled) {
              output = config.mockResponse || "Respuesta Gemini mockeada";
            } else {
              const prompt = config.prompt.includes("{{output}}") 
                ? config.prompt.replace("{{output}}", lastOutput)
                : `${config.prompt}\n\n${lastOutput}`;

              console.log(` [GEMINI] Llamando a gemini-3-flash-preview (v1beta)...`);
              const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent", {
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
            output = "Trigger activado con éxito";
          } else if (currentNode.type.toLowerCase().includes("debug")) {
            // Lógica de Alerta Debug (Pausa el motor hasta que el usuario acepte)
            await db.executionStep.update({
              where: { id: step.id },
              data: { status: "WAITING", output: lastOutput }
            });

            // Esperar a que el status sea COMPLETED (confirmado por el usuario en el frontend)
            let confirmed = false;
            while (!confirmed) {
              await new Promise(r => setTimeout(r, 1000));
              const currentStep = await db.executionStep.findUnique({ where: { id: step.id } });
              if (currentStep?.status === "COMPLETED") {
                confirmed = true;
                output = lastOutput; // El debug no modifica el output
              } else if (currentStep?.status === "FAILED") {
                throw new Error("Ejecución cancelada en el nodo Debug");
              }
            }
            // Ya se marcó como COMPLETED por el endpoint de confirmación, así que saltamos el update final
            const outgoingEdges = workflow.edges.filter((e: any) => e.sourceNodeId === currentNode.id);
            outgoingEdges.forEach((edge: any) => {
              queue.push({ nodeId: edge.targetNodeId, lastOutput: output });
            });
            continue; 
          }

          await db.executionStep.update({
            where: { id: step.id },
            data: { status: "COMPLETED", output, finishedAt: new Date() }
          });

          // Buscar todos los siguientes nodos (Paralelismo)
          const outgoingEdges = workflow.edges.filter((e: any) => e.sourceNodeId === currentNode.id);
          outgoingEdges.forEach((edge: any) => {
            queue.push({ nodeId: edge.targetNodeId, lastOutput: output });
          });

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
    console.error(error);
    // Actualizar el estado de la ejecución a FAILED
    try {
      await db.workflowExecution.update({
        where: { id: execution.id },
        data: { status: "FAILED" }
      });
    } catch (dbErr) { console.error("Error updating execution status to FAILED", dbErr); }
    
    return NextResponse.json({ success: false, error: error.message });
  }
}
