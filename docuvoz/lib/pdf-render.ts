import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type EmbeddedFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function countLeadingSpaces(value: string) {
  const match = value.match(/^ */);
  return match ? match[0].length : 0;
}

function wrapLineToWidth(params: {
  text: string;
  font: EmbeddedFont;
  size: number;
  maxWidth: number;
  firstPrefix?: string;
  continuationPrefix?: string;
}) {
  const {
    text,
    font,
    size,
    maxWidth,
    firstPrefix = "",
    continuationPrefix = firstPrefix,
  } = params;

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [firstPrefix.trimEnd()];
  }

  const lines: string[] = [];
  let currentPrefix = firstPrefix;
  let currentText = "";

  const fits = (prefix: string, content: string) =>
    font.widthOfTextAtSize(`${prefix}${content}`, size) <= maxWidth;

  for (const word of words) {
    const candidate = currentText ? `${currentText} ${word}` : word;

    if (!currentText || fits(currentPrefix, candidate)) {
      currentText = candidate;
      continue;
    }

    lines.push(`${currentPrefix}${currentText}`.trimEnd());
    currentPrefix = continuationPrefix;
    currentText = word;

    while (!fits(currentPrefix, currentText) && currentText.length > 1) {
      let splitIndex = currentText.length - 1;

      while (
        splitIndex > 1 &&
        !fits(currentPrefix, `${currentText.slice(0, splitIndex)}-`)
      ) {
        splitIndex -= 1;
      }

      if (splitIndex <= 1) {
        break;
      }

      lines.push(`${currentPrefix}${currentText.slice(0, splitIndex)}-`);
      currentText = currentText.slice(splitIndex);
    }
  }

  if (currentText) {
    lines.push(`${currentPrefix}${currentText}`.trimEnd());
  }

  return lines;
}

function getLineStyle(rawLine: string, left: number) {
  const expandedLine = rawLine.replace(/\t/g, "    ").trimEnd();
  const trimmedLine = expandedLine.trim();

  if (!trimmedLine) {
    return null;
  }

  const leadingSpaces = countLeadingSpaces(expandedLine);
  const indentSpaces = " ".repeat(Math.min(leadingSpaces, 12));
  const bulletMatch = trimmedLine.match(/^([•*-]|\d+[\.\)])\s+(.*)$/);
  const isHeading =
    !bulletMatch &&
    trimmedLine.length <= 90 &&
    (trimmedLine === trimmedLine.toUpperCase() ||
      trimmedLine.endsWith(":") ||
      /^\d+(\.\d+)*[\.\)]/.test(trimmedLine));

  if (bulletMatch) {
    const marker = bulletMatch[1];
    const content = bulletMatch[2];
    const continuationIndent = " ".repeat(
      Math.min(Math.max(marker.length + 1, leadingSpaces + 2), 12),
    );

    return {
      text: content,
      x: left,
      firstPrefix: `${indentSpaces}${marker} `,
      continuationPrefix: continuationIndent,
      fontType: "body" as const,
      size: 11,
      extraSpacing: 4,
    };
  }

  return {
    text: trimmedLine,
    x: left,
    firstPrefix: indentSpaces,
    continuationPrefix: indentSpaces,
    fontType: isHeading ? ("heading" as const) : ("body" as const),
    size: isHeading ? 11.5 : 11,
    extraSpacing: isHeading ? 8 : 4,
  };
}

export async function renderSpanishPdf(params: {
  title: string;
  translatedText: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const headingFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  let page = pdfDoc.addPage([612, 792]);
  let cursorY = 750;
  const left = 50;
  const right = 562;
  const lineHeight = 16;
  const maxWidth = right - left;

  const ensureSpace = (neededLines = 1) => {
    if (cursorY - neededLines * lineHeight < 60) {
      page = pdfDoc.addPage([612, 792]);
      cursorY = 750;
    }
  };

  page.drawText(params.title, {
    x: left,
    y: cursorY,
    size: 16,
    font: headingFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 30;

  page.drawText("Traduccion completa", {
    x: left,
    y: cursorY,
    size: 12,
    font: headingFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  cursorY -= 22;

  for (const rawLine of params.translatedText.split("\n")) {
    const style = getLineStyle(rawLine, left);

    if (!style) {
      cursorY -= lineHeight;
      continue;
    }

    const activeFont = style.fontType === "heading" ? headingFont : bodyFont;
    const wrappedLines = wrapLineToWidth({
      text: style.text,
      font: activeFont,
      size: style.size,
      maxWidth,
      firstPrefix: style.firstPrefix,
      continuationPrefix: style.continuationPrefix,
    });

    for (const wrappedLine of wrappedLines) {
      ensureSpace();
      page.drawText(wrappedLine, {
        x: style.x,
        y: cursorY,
        size: style.size,
        font: activeFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      cursorY -= lineHeight;
    }

    cursorY -= style.extraSpacing;
  }

  return Buffer.from(await pdfDoc.save());
}
