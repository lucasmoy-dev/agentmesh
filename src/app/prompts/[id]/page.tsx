import { db } from "@/lib/prisma";
import { PromptForm } from "@/components/PromptForm";
import { notFound } from "next/navigation";

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = await db.prompt.findUnique({
    where: { id },
  });

  if (!prompt) {
    notFound();
  }

  return <PromptForm initialData={prompt} isEdit={true} />;
}
