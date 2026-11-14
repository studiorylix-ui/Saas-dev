import { sb } from "./supabase/client";

// Réduit la photo à 1600 px max (JPEG) puis l'envoie dans le bucket public post-images.
export async function uploadImage(file: File, uid: string): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.85));
  const path = `${uid}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb().storage.from("post-images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return sb().storage.from("post-images").getPublicUrl(path).data.publicUrl;
}
