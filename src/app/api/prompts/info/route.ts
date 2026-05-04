import { NextResponse } from "next/server";

export async function GET() {
  const info = `
PROMPT API INFO
===============

1. GET /api/prompts/next?password=YOUR_PASSWORD
   Returns the next prompt to execute.
   Format: { id, slug, content }
   Returns 204 No Content if nothing is ready.

2. POST /api/prompts/[slug]?password=YOUR_PASSWORD
   Saves the result of the prompt execution.
   Body: { "result": "The result text..." }
   Returns: { "success": true, "nextExecutionAt": "..." }

3. GET /api/prompts/info
   This information.
  `.trim();

  return new NextResponse(info, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
