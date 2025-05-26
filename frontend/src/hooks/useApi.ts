import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

const useApi = <T, U = any>(
  method: Method,
  url: string,
  initialRequestData?: U
) => {
  const [response, setResponse] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const callApi = async (requestData?: U) => {
    setResponse({ ...response, loading: true, error: null });

    try {
      let apiResponse;

      if (method === "GET") {
        apiResponse = await axiosInstance.get(url, {
          params: requestData,
        });
      } else {
        apiResponse = await axiosInstance.request({
          method,
          url,
          data: requestData || initialRequestData,
        });
      }

      const result = {
        data: apiResponse.data,
        error: null,
        loading: false,
      };

      setResponse(result);
      return result; // Trả kết quả
    } catch (err: any) {
      const errorResult = {
        data: null,
        error: err?.message || "Có lỗi xảy ra",
        loading: false,
      };
      setResponse(errorResult);
      return errorResult; // Trả lỗi
    }
  };

  return { ...response, callApi };
};

export default useApi;
