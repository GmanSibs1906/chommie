// Crops the answer region from a stored (masked) page so the teacher sees just that answer. Falls back to the whole page.
export async function cropAnswer(blob, box) {
  const bmp = await createImageBitmap(blob);
  const ok = Array.isArray(box) && box.length === 4 && box.every((n) => typeof n === "number" && n >= 0 && n <= 1) && box[2] > box[0] && box[3] > box[1];
  const padX = 0.04, padY = 0.03;
  const [x0, y0, x1, y1] = ok ? [Math.max(0, box[0] - padX), Math.max(0, box[1] - padY), Math.min(1, box[2] + padX), Math.min(1, box[3] + padY)] : [0, 0, 1, 1];
  const c = document.createElement("canvas"); c.width = Math.round((x1 - x0) * bmp.width); c.height = Math.round((y1 - y0) * bmp.height);
  c.getContext("2d").drawImage(bmp, x0 * bmp.width, y0 * bmp.height, c.width, c.height, 0, 0, c.width, c.height);
  return { url: c.toDataURL("image/jpeg", 0.85), cropped: ok };
}
