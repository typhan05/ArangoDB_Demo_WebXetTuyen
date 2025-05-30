import React, { useEffect, useState } from "react";
import axios from "axios";
import ChiTietForm from "./Details/ChiTietForm";

interface FormXetTuyen {
  MaForm: string;
  HoTen: string;
  NgaySinh: string;
  GioiTinh: string;
  CCCD: string;
  Email: string;
  SoDienThoai: string;
  DiaChi: string;
  NamTotNghiep: number;
  CoNguyenVongDuHoc: string;
  NgayDangKy: string;
  MaTruong: string;
  DiemThi: number;
  TenTruong?: string;
  TenNganhHoc?: string;
  TenHinhThuc?: string;
  DiemChuan?: number;
  KetQua?: string;
}

const KetQuaLop12 = () => {
  const [data, setData] = useState<FormXetTuyen[]>([]);
  const [chiTiet, setChiTiet] = useState<FormXetTuyen | null>(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/admin/list-form-xet-tuyen")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const genderLabel = (g: string) => (g === "1" ? "Nam" : "Nữ");
  const duHocLabel = (val: string) => (val === "1" ? "Có" : "Không");

  // Hàm xuất CSV
  const exportCSV = () => {
    if (data.length === 0) return;

    // Tiêu đề cột
    const headers = [
      "Mã Form",
      "Họ tên",
      "Ngày sinh",
      "Giới tính",
      "CCCD",
      "Email",
      "SĐT",
      "Địa chỉ",
      "Năm tốt nghiệp",
      "Nguyện vọng du học",
      "Tên trường",
      "Điểm thi",
      "Ngày đăng ký",
      "Kết quả",
      "Ngành học",
    ];

    // Chuyển data thành mảng mảng giá trị string
    const rows = data.map((form) => [
      form.MaForm,
      form.HoTen,
      form.NgaySinh,
      genderLabel(form.GioiTinh),
      form.CCCD,
      form.Email,
      form.SoDienThoai,
      form.DiaChi,
      form.NamTotNghiep !== undefined && form.NamTotNghiep !== null
        ? form.NamTotNghiep.toString()
        : "",
      duHocLabel(form.CoNguyenVongDuHoc),
      form.TenTruong || "",
      form.DiemThi !== undefined && form.DiemThi !== null
        ? form.DiemThi.toString()
        : "",
      form.NgayDangKy,
      form.KetQua || "",
      form.TenNganhHoc || "",
    ]);


    // Ghép tiêu đề và dữ liệu
    const csvContent =
      [headers, ...rows]
        .map((e) =>
          e
            .map((v) => `"${String(v).replace(/"/g, '""')}"`) // escape dấu "
            .join(",")
        )
        .join("\n");

    // Tạo file blob và tải về
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "form_xet_tuyen.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {!chiTiet ? (
        <>
          <h2 className="font-bold text-lg mb-4">Danh sách Form Xét Tuyển</h2>
          <button
            onClick={exportCSV}
            className="mb-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📥 Xuất CSV
          </button>

          <div className="overflow-auto max-w-full max-h-[80vh]">
            <table className="w-full border border-collapse text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th>STT</th>
                  <th>Mã Form</th>
                  <th>Họ tên</th>
                  <th>Ngày sinh</th>
                  <th>Giới tính</th>
                  <th>CCCD</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Địa chỉ</th>
                  <th>Năm tốt nghiệp</th>
                  <th>Nguyện vọng du học</th>
                  <th>Tên trường</th>
                  <th>Điểm thi</th>
                  <th>Ngày đăng ký</th>
                  <th>Kết quả</th>
                  <th>Ngành học</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data.map((form, index) => (
                  <tr
                    key={form.MaForm}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{form.MaForm}</td>
                    <td>{form.HoTen}</td>
                    <td>{form.NgaySinh}</td>
                    <td>{genderLabel(form.GioiTinh)}</td>
                    <td>{form.CCCD}</td>
                    <td>{form.Email}</td>
                    <td>{form.SoDienThoai}</td>
                    <td>{form.DiaChi}</td>
                    <td>{form.NamTotNghiep}</td>
                    <td>{duHocLabel(form.CoNguyenVongDuHoc)}</td>
                    <td>{form.TenTruong}</td>
                    <td>{form.DiemThi}</td>
                    <td>{form.NgayDangKy}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: form.KetQua === "Đậu" ? "green" : "red",
                      }}
                    >
                      {form.KetQua}
                    </td>
                    <td>{form.TenNganhHoc}</td>
                    <td>
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setChiTiet(form)}
                      >
                        📑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ChiTietForm form={chiTiet} onBack={() => setChiTiet(null)} />
      )}
    </div>
  );
};

export default KetQuaLop12;
