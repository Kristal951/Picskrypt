export const photoPath = (id: string) => `/pictures/${id}`;

export const absolutePhotoUrl = (id: string) =>
  `${window.location.origin}${photoPath(id)}`;

export function downloadUrl(imageUrl: string, title?: string | null): string {
  if (
    !imageUrl.includes("res.cloudinary.com") ||
    !imageUrl.includes("/upload/")
  ) {
    return imageUrl;
  }
  const name =
    (title || "picskrypt")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "picskrypt";
  return imageUrl.replace("/upload/", `/upload/fl_attachment:${name}/`);
}

export function ogImageUrl(imageUrl: string): string {
  if (
    !imageUrl.includes("res.cloudinary.com") ||
    !imageUrl.includes("/upload/")
  ) {
    return imageUrl;
  }
  return imageUrl.replace(
    "/upload/",
    "/upload/f_jpg,q_auto,w_1200,h_630,c_fill,g_auto/",
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}
