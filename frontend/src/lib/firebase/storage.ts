/**
 * Client-side image compression and encoding to Base64 Data URL.
 * Allows storing photo evidence directly in Firestore documents without requiring paid Firebase Storage.
 */
export async function compressAndEncodeImage(
  file: File,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g. video), return an empty or name reference
    if (!file.type.startsWith("image/")) {
      resolve(`[Media Attached: ${file.name}]`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to process image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
