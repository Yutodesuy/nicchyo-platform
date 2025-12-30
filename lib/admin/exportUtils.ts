/**
 * エクスポートユーティリティ
 * CSV/JSON形式でデータをダウンロード
 */

/**
 * CSVエクスポート
 */
export function exportToCSV<T extends Record<string, string | number | boolean | null>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): { success: boolean; error?: string } {
  if (data.length === 0) {
    return { success: false, error: "エクスポートするデータがありません" };
  }

  // ヘッダー行を作成
  const keys = Object.keys(data[0]) as (keyof T)[];
  const headerRow = keys
    .map((key) => headers?.[key] || String(key))
    .map(escapeCSV)
    .join(",");

  // データ行を作成
  const dataRows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return escapeCSV(JSON.stringify(value));
        return escapeCSV(String(value));
      })
      .join(",")
  );

  // CSV文字列を結合
  const csv = [headerRow, ...dataRows].join("\n");

  // BOM付きUTF-8で保存（Excelで文字化けしないように）
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  try {
    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    return { success: false, error: "エクスポートに失敗しました" };
  }
}

/**
 * JSONエクスポート
 */
export function exportToJSON<T>(data: T[], filename: string): { success: boolean; error?: string } {
  if (data.length === 0) {
    return { success: false, error: "エクスポートするデータがありません" };
  }

  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    downloadBlob(blob, filename);
    return { success: true };
  } catch (error) {
    return { success: false, error: "エクスポートに失敗しました" };
  }
}

/**
 * CSV用エスケープ処理
 */
function escapeCSV(value: string): string {
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Blobをダウンロード
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 日付をファイル名用フォーマットに変換
 * @example formatDateForFilename() // "20241230_143025"
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}
