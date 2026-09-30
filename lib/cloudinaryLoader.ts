export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace("/upload/", `/upload/f_auto,${q},w_${width},c_limit/`);
}
