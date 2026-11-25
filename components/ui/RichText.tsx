import "server-only";
import sanitize from "sanitize-html";
import { toHtml } from "@/lib/richText";
import { cn } from "@/lib/utils";

// Keep in step with the API's utils/sanitizeHtml.ts. Content is cleaned again
// here so nothing stored by another route reaches a visitor unfiltered.
const OPTIONS: sanitize.IOptions = {
  allowedTags: ["p", "br", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "a"],
  allowedAttributes: { a: ["href", "target", "rel"], ol: ["start"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitize.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

export function RichText({ value, className }: { value: string; className?: string }) {
  return <div className={cn("prose", className)} dangerouslySetInnerHTML={{ __html: sanitize(toHtml(value), OPTIONS) }} />;
}
