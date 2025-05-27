// hooks/useUploadFile.ts
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

const useUploadFile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = response.data?.result?.url;
      setUrl(fileUrl);
      return fileUrl;
    } catch (err: any) {
      setError(err.message || "Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error, url };
};

export default useUploadFile;
