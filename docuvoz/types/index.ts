export type DocumentStatus = "processing" | "ready" | "error";

export type DocumentLanguage = "en" | "es" | "ht" | "other";

export type Document = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  mime_type: string;
  extracted_text: string | null;
  translated_text: string | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
};

export type Message = {
  role: "user" | "assistant";
  message: string;
  created_at: string;
};

export type Voice = {
  id: string;
  name: string;
  language: "es" | "en";
};

export type ApiError = {
  error: string;
};

export type ApiSuccess<T> = {
  data: T;
};
