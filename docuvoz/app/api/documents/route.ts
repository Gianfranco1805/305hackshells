import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { client, userId } = await createServerClient();
    const { data, error } = await client
      .from("private_documents")
      .select(
        "id,title,language,file_name,mime_type,extraction_status,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load documents.";

    return Response.json(
      { error: message },
      {
        status: message.toLowerCase().includes("unauthenticated") ? 401 : 500,
      },
    );
  }
}
