/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Thêm bất kỳ biến môi trường nào khác mà bạn sử dụng
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
