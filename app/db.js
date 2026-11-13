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
export const putPhoto = (p) => tx("readwrite", (s) => s.put(p));
export const listPhotos = () => tx("readonly", (s) => s.getAll());
export const deletePhoto = (id) => tx("readwrite", (s) => s.delete(id));
export async function deleteByCode(code) { for (const p of await listPhotos()) if (p.code === code) await deletePhoto(p.id); }
export async function deleteAll() { for (const p of await listPhotos()) await deletePhoto(p.id); }
export const blobToDataUrl = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
