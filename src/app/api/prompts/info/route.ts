import { NextResponse } from "next/server";

export async function GET() {
  const info = {
    name: "AgentMesh API",
    version: "1.1.0",
    auth: "SHA256 Hash required in 'password' query param",
    endpoints: [
      {
        path: "/api/prompts/next",
        method: "GET",
        description: "Obtiene el próximo prompt pendiente de ejecución (formato JSON)."
      },
      {
        path: "/api/prompts/[id_o_slug]",
        method: "GET",
        description: "Obtiene exclusivamente el CONTENIDO del prompt (texto plano)."
      },
      {
        path: "/api/prompts/[id_o_slug]/result",
        method: "GET",
        description: "Obtiene exclusivamente el RESULTADO de la última ejecución (texto plano)."
      },
      {
        path: "/api/prompts/[id]",
        method: "POST",
        description: "Reporta el resultado de una ejecución (JSON body: { result: string })."
      }
    ]
  };

  return NextResponse.json(info);
}
