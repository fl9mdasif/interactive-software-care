// Descriptions are HTML from the dashboard editor. Older ones are plain text.
// No server-only code here: cards that use excerpt() also render in the browser.

const IS_HTML = /^\s*<(p|h2|h3|ul|ol|blockquote|pre)[\s/>]/i;
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/** Stored description to HTML. Not sanitised: render it with <RichText>. */
export const toHtml = (value: string) =>
  IS_HTML.test(value)
    ? value
    : value
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => `<p>${block.replace(/[&<>]/g, (c) => ESCAPES[c]).replace(/\n/g, "<br />")}</p>`)
        .join("");

/** Readable text without markup. Safe to render as a React string. */
export const toPlainText = (value: string) =>
  toHtml(value)
    .replace(/<\/(p|h2|h3|li|blockquote|pre)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, " ")
    .trim();

export const excerpt = (value: string, length: number) => {
  const text = toPlainText(value);
  if (text.length <= length) return text;
  const cut = text.slice(0, length - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > length / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
};
