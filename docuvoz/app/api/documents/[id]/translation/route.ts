import { createServerClient } from "@/lib/supabase";
import { deletePrivateDocumentTranslation } from "@/lib/document-translation";

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { client, userId } = await createServerClient();
    const params = await context.params;
    const documentId = parseId(params.id);

    if (!documentId) {
      return Response.json({ error: "Invalid document id." }, { status: 400 });
    }

    const { data, error } = await client
      .from("private_document_translations")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "Translation not found." }, { status: 404 });
    }

    return Response.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load translation.";

    return Response.json(
      { error: message },
      {
        status: message.toLowerCase().includes("unauthenticated") ? 401 : 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const documentId = parseId(params.id);

    if (!documentId) {
      return Response.json({ error: "Invalid document id." }, { status: 400 });
    }

    const result = await deletePrivateDocumentTranslation(documentId);

    return Response.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete translation.";

    if (message.toLowerCase().includes("translation not found")) {
      return Response.json({ error: message }, { status: 404 });
    }

    return Response.json(
      { error: message },
      {
        status: message.toLowerCase().includes("unauthenticated") ? 401 : 500,
      },
    );
  }
}
