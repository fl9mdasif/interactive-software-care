/**
 * Download rows as CSV. Cells that a spreadsheet would run as a formula are
 * prefixed with an apostrophe, because customer names come from outside.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  // The BOM makes Excel read Bangla text as UTF-8.
  const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
