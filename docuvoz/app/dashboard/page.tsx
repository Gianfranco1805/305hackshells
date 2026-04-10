import DashboardClient from "@/components/DashboardClient";
import { listDocumentsForUser } from "@/lib/documents";
import { createServerClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const { client, userId } = await createServerClient();
  const documents = await listDocumentsForUser(client, userId);

  return <DashboardClient initialDocuments={documents} />;
}
