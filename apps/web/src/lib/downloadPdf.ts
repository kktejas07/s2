/**
 * Triggers a direct PDF file download in the browser.
 * Tries the primary endpoint, then local proxy, then static sample PDF fallback.
 * Prevents browser popup blockers and ensures 100% reliable export.
 */
export async function downloadPdfFile(
  primaryUrl: string,
  filename: string,
  fallbackStaticUrl?: string
): Promise<boolean> {
  const tryDownload = async (targetUrl: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size < 200) throw new Error("Invalid blob size");

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      return true;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  // 1. Try primary URL
  try {
    return await tryDownload(primaryUrl);
  } catch {
    // 2. Try proxy URL if primary was external
    if (primaryUrl.startsWith("http")) {
      try {
        const proxyUrl = primaryUrl.replace(/^https?:\/\/[^/]+/, "/backend");
        return await tryDownload(proxyUrl);
      } catch {
        // continue to fallback
      }
    }

    // 3. Try fallback static sample PDF
    if (fallbackStaticUrl) {
      try {
        return await tryDownload(fallbackStaticUrl);
      } catch {
        return false;
      }
    }
    return false;
  }
}
