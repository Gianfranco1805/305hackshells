import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractionMethod = "pdf" | "docx" | "ocr" | "none";
export type ExtractionStatus = "not_attempted" | "success" | "partial" | "failed";

export type ExtractionResult = {
  extractedText: string;
  extractionMethod: ExtractionMethod;
  extractionStatus: ExtractionStatus;
  pageCount: number | null;
  isFillablePdf: boolean;
};

export async function extractDocumentText(
  fileBuffer: Buffer,
  fileExtension: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const extension = fileExtension.toLowerCase();

  if (extension === ".pdf" || mimeType === "application/pdf") {
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getText();
      const extractedText = parsed.text.trim();
      await parser.destroy();

      return {
        extractedText,
        extractionMethod: "pdf",
        extractionStatus: extractedText ? "success" : "partial",
        pageCount: parsed.total ?? null,
        isFillablePdf: false,
      };
    } catch {
      return {
        extractedText: "",
        extractionMethod: "none",
        extractionStatus: "failed",
        pageCount: null,
        isFillablePdf: false,
      };
    }
  }

  if (
    extension === ".docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({
        buffer: fileBuffer,
      });
      const extractedText = result.value.trim();

      return {
        extractedText,
        extractionMethod: "docx",
        extractionStatus: extractedText ? "success" : "partial",
        pageCount: null,
        isFillablePdf: false,
      };
    } catch {
      return {
        extractedText: "",
        extractionMethod: "none",
        extractionStatus: "failed",
        pageCount: null,
        isFillablePdf: false,
      };
    }
  }

  if (extension === ".doc" || mimeType === "application/msword") {
    return {
      extractedText: "",
      extractionMethod: "none",
      extractionStatus: "not_attempted",
      pageCount: null,
      isFillablePdf: false,
    };
  }

  if (mimeType.startsWith("image/")) {
    return {
      extractedText: "",
      extractionMethod: "none",
      extractionStatus: "not_attempted",
      pageCount: null,
      isFillablePdf: false,
    };
  }

  return {
    extractedText: "",
    extractionMethod: "none",
    extractionStatus: "failed",
    pageCount: null,
    isFillablePdf: false,
  };
}
