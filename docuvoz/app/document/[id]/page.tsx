import { notFound } from "next/navigation";
import DocumentPageClient from "@/components/DocumentPageClient";
import { getDocumentForUser } from "@/lib/documents";
import { createServerClient } from "@/lib/supabase";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const { client, userId } = await createServerClient();
  const document = await getDocumentForUser(client, userId, id);

  if (!document) {
    notFound();
  }

  return <DocumentPageClient document={document} />;
}
