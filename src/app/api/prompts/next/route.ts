import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.API_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // Find a prompt that is enabled and due
  const prompt = await db.prompt.findFirst({
    where: {
      enabled: true,
      nextExecutionAt: {
        lte: now,
      },
    },
    orderBy: {
      nextExecutionAt: "asc",
    },
  });

  if (!prompt) {
    return new NextResponse("", { status: 204 });
  }

  // Temporarily bump nextExecutionAt to prevent other workers/polls from picking it up
  // while the Pi is processing it.
  await db.prompt.update({
    where: { id: prompt.id },
    data: {
      nextExecutionAt: addMinutes(now, 5), // 5 minute lock
    },
  });

  return NextResponse.json({
    id: prompt.id,
    slug: prompt.slug,
    content: prompt.content,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}
