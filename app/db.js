// Photos live in IndexedDB on this phone: a weak signal loses nothing, and they are deleted once marks are confirmed.
let dbp;
function open() {
  return (dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open("chommie", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("photos", mode), s = t.objectStore("photos"), out = fn(s); t.oncomplete = () => res(out?.result); t.onerror = () => rej(t.error); }); };
import { activeId } from "./state.js";
// Every photo carries the class it was taken in, so two classes never see each other's books.
export const putPhoto = (p) => tx("readwrite", (s) => s.put({ ...p, cls: p.cls || activeId() }));
export const listPhotos = async () => (await tx("readonly", (s) => s.getAll())).filter((p) => (p.cls || null) === activeId() || (!p.cls && !activeId()));
export const deletePhoto = (id) => tx("readwrite", (s) => s.delete(id));
export async function deleteByCode(code) { for (const p of await listPhotos()) if (p.code === code) await deletePhoto(p.id); }
export async function deleteAll() { for (const p of await listPhotos()) await deletePhoto(p.id); }
export const blobToDataUrl = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
export const kindOf = (p) => p.kind || "class"; // photos saved before personal homework existed are class photos
export async function deleteWhere(fn) { for (const p of await listPhotos()) if (fn(p)) await deletePhoto(p.id); }
