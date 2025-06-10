/**
 * 画像ファイルのFormDataを受け取り、指定URLへPOSTリクエストするユーティリティ
 */
export async function postImageForm(file: Express.Multer.File | File): Promise<any> {
  const formData = new FormData();

  if ((file as File).name !== undefined && (file as File).type !== undefined) {
    // Browser File
    formData.append("file", file as File);
  } else {
    // Express.Multer.File
    const multerFile = file as Express.Multer.File;
    const blob = new Blob([multerFile.buffer], { type: multerFile.mimetype });
    formData.append("file", blob, multerFile.originalname);
  }

  const url = import.meta.env?.VITE_AI_BACKEND_URL;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`画像アップロードに失敗しました: ${response.statusText}`);
  }
  const data = await response.json();
  // Parse the result if it's a JSON string
  if (data && typeof data.result === "string") {
    try {
      data.result = JSON.parse(data.result);
    } catch (e) {
      // If parsing fails, keep as string
    }
  }

  return data;
}