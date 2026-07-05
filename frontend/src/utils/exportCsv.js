function escapeCsvCell(value) {
  const text = value === null || value === undefined
    ? ""
    : String(value);

  /*
   * Prevent spreadsheet applications from interpreting
   * untrusted values as formulas.
   */
  const safeText = /^[=+\-@\t\r]/.test(text.trimStart())
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

export function exportToCsv({
  filename,
  columns,
  rows,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const headerRow = columns
    .map((column) => escapeCsvCell(column.label))
    .join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.getValue
          ? column.getValue(row)
          : row[column.key];

        return escapeCsvCell(value);
      })
      .join(",")
  );

  const csvContent = [
    headerRow,
    ...dataRows,
  ].join("\r\n");

  // UTF-8 BOM helps preserve special characters.
  const blob = new Blob(
    ["\uFEFF", csvContent],
    {
      type: "text/csv;charset=utf-8",
    }
  );

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = filename.endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}