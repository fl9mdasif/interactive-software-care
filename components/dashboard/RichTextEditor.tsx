"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Code, Italic, Link2, List, ListOrdered, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2,
} from "lucide-react";
import { toHtml } from "@/lib/richText";
import { cn } from "@/lib/utils";
import { Button, Input } from "./ui";

type Tool = {
  name: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
  disabled?: (editor: Editor) => boolean;
};

const chain = (editor: Editor) => editor.chain().focus();
const icon = "size-4";

const TOOLS: Tool[][] = [
  [
    { name: "Undo", icon: <Undo2 className={icon} />, run: (e) => chain(e).undo().run(), disabled: (e) => !e.can().undo() },
    { name: "Redo", icon: <Redo2 className={icon} />, run: (e) => chain(e).redo().run(), disabled: (e) => !e.can().redo() },
  ],
  [
    { name: "Paragraph", icon: "P", run: (e) => chain(e).setParagraph().run(), active: (e) => e.isActive("paragraph") },
    { name: "Heading", icon: "H2", run: (e) => chain(e).toggleHeading({ level: 2 }).run(), active: (e) => e.isActive("heading", { level: 2 }) },
    { name: "Subheading", icon: "H3", run: (e) => chain(e).toggleHeading({ level: 3 }).run(), active: (e) => e.isActive("heading", { level: 3 }) },
  ],
  [
    { name: "Bold", icon: <Bold className={icon} />, run: (e) => chain(e).toggleBold().run(), active: (e) => e.isActive("bold") },
    { name: "Italic", icon: <Italic className={icon} />, run: (e) => chain(e).toggleItalic().run(), active: (e) => e.isActive("italic") },
    { name: "Underline", icon: <Underline className={icon} />, run: (e) => chain(e).toggleUnderline().run(), active: (e) => e.isActive("underline") },
    { name: "Strikethrough", icon: <Strikethrough className={icon} />, run: (e) => chain(e).toggleStrike().run(), active: (e) => e.isActive("strike") },
  ],
  [
    { name: "Bullet list", icon: <List className={icon} />, run: (e) => chain(e).toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
    { name: "Numbered list", icon: <ListOrdered className={icon} />, run: (e) => chain(e).toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
    { name: "Quote", icon: <Quote className={icon} />, run: (e) => chain(e).toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
    { name: "Code block", icon: <Code className={icon} />, run: (e) => chain(e).toggleCodeBlock().run(), active: (e) => e.isActive("codeBlock") },
  ],
  [{ name: "Clear formatting", icon: <RemoveFormatting className={icon} />, run: (e) => chain(e).unsetAllMarks().clearNodes().run() }],
];

/** Inline address bar for links; a browser prompt would block the page. */
function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href ?? "");

  const apply = () => {
    const value = url.trim();
    if (!value) {
      chain(editor).extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:|mailto:|tel:)/i.test(value) ? value : `https://${value}`;
      if (editor.state.selection.empty && !editor.isActive("link")) {
        chain(editor).insertContent({ type: "text", text: value, marks: [{ type: "link", attrs: { href } }] }).run();
      } else {
        chain(editor).extendMarkRange("link").setLink({ href }).run();
      }
    }
    onClose();
  };

  return (
    <div className="flex flex-wrap gap-2 border-b border-line p-2">
      <Input
        className="min-w-0 flex-1"
        aria-label="Link address"
        placeholder="https://example.com (leave empty to remove)"
        value={url}
        autoFocus
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          // Enter must not submit the surrounding form.
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") onClose();
        }}
      />
      <Button size="sm" className="h-10" onClick={apply}>
        Apply
      </Button>
      <Button size="sm" variant="ghost" className="h-10" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  // Re-render the toolbar when the cursor moves, so pressed states stay right.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      tools: TOOLS.flat().map((t) => ({ active: t.active?.(editor), disabled: t.disabled?.(editor) })),
      link: editor.isActive("link"),
    }),
  });
  const button = (active?: boolean) =>
    cn(
      "grid h-8 min-w-8 cursor-pointer place-items-center rounded-md px-1.5 text-xs font-semibold transition-colors disabled:cursor-default disabled:opacity-40",
      active ? "bg-acid text-on-accent" : "text-text-mid hover:bg-tint hover:text-text",
    );
  let index = 0;

  return (
    <>
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-1 border-b border-line p-1.5">
        {TOOLS.map((group, g) => (
          <div key={g} className="flex gap-0.5 border-r border-line pr-1 last:border-0">
            {group.map((tool) => {
              const { active, disabled } = state.tools[index++];
              return (
                <button
                  key={tool.name}
                  type="button"
                  title={tool.name}
                  aria-label={tool.name}
                  aria-pressed={tool.active ? !!active : undefined}
                  disabled={disabled}
                  className={button(active)}
                  onClick={() => tool.run(editor)}
                >
                  {tool.icon}
                </button>
              );
            })}
          </div>
        ))}
        <button type="button" title="Link" aria-label="Link" aria-pressed={state.link} className={button(state.link)} onClick={() => setLinking((v) => !v)}>
          <Link2 className={icon} />
        </button>
      </div>
      {linking && <LinkBar editor={editor} onClose={() => setLinking(false)} />}
    </>
  );
}

/** `value` is only read when the editor is created; remount to load other content. */
export function RichTextEditor({ label, value, onChange }: { label: string; value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
        link: { openOnClick: false, defaultProtocol: "https" },
      }),
    ],
    content: toHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose min-h-56 max-w-none px-4 py-3 focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label.replace(" *", ""),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-mid">{label}</span>
      <div className="overflow-hidden rounded-lg border border-line-strong bg-surface-2 focus-within:border-acid">
        {editor ? (
          <>
            <Toolbar editor={editor} />
            <div className="max-h-[32rem] overflow-y-auto">
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="h-64" />
        )}
      </div>
    </div>
  );
}
