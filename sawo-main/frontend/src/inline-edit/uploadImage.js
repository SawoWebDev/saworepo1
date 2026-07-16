// src/inline-edit/uploadImage.js
// Same WebP-convert-then-upload pattern as ContentCMS.jsx's
// uploadImageToSupabase, targeting the same `site-content-images` bucket so
// inline edits and the form-based CMS share one image store.

import { supabase } from "../Administrator/supabase";

const BUCKET = "site-content-images";
const WEBP_QUALITY = 0.85;
const WEBP_MAX_DIM = 1920;

function convertToWebP(file, maxDim = WEBP_MAX_DIM, quality = WEBP_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("WebP conversion failed"))),
        "image/webp", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

export async function uploadImageToSupabase(file, folder = "") {
  const webpBlob = await convertToWebP(file);
  const filename = `${folder ? folder + "/" : ""}${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}.webp`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, webpBlob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}
