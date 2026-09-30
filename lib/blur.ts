export async function getBlurDataURL(imageUrl: string): Promise<string | null> {
  try {
    const tinyUrl = imageUrl.replace(
      "/upload/",
      "/upload/w_16,q_40,f_jpg,e_blur:200/",
    );
    const res = await fetch(tinyUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}