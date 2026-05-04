import { db } from "@/lib/prisma";
import { PromptForm } from "@/components/PromptForm";
import { notFound } from "next/navigation";

export default async function EditPromptPage(props: { params: Promise<{ promptId: string }> }) {
  const params = await props.params;
  const promptId = params.promptId;
  
  const prompt = await db.prompt.findUnique({
    where: { id: promptId },
  });

  if (!prompt) {
    notFound();
  }

  return <PromptForm initialData={prompt} isEdit={true} />;
}
