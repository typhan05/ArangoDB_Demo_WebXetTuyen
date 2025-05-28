import React, { useEffect, useState } from "react";
import axios from "axios";
import ChiTietForm from "./Details/ChiTietForm"; // Điều chỉnh nếu path khác

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
    Ketqua?: string;
}

interface FormWithNganh {
    form: FormXetTuyen;
    nganh: string;
}



const KetQuaLop12 = () => {
    const [data, setData] = useState<FormWithNganh[]>([]);
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

    return (
        <div style={{ padding: "16px" }}>
            {!chiTiet ? (
                // =========== BẢNG DANH SÁCH ===========
                <div>
                    <h2>Danh sách Form Xét Tuyển</h2>
                    <table className="bang-xet-tuyen" border={1} cellPadding={5} cellSpacing={0}>
                        <thead style={{ backgroundColor: "#3b82f6", color: "white" }}>
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
                            {data.map(({ form, nganh }, index) => (
                                <tr
                                    key={form.MaForm}
                                    style={{
                                        backgroundColor: index % 2 === 0 ? "#fff" : "#f5f5f5",
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
                                            color: form.Ketqua === "1" ? "green" : "red",
                                        }}
                                    >
                                        {form.Ketqua === "1" ? "Đậu" : "Rớt"}
                                    </td>
                                    <td>{nganh}</td> {/* Tên ngành học */}
                                    <td>
                                        <button onClick={() => setChiTiet(form)}>📑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // =========== BẢNG CHI TIẾT ===========
                <ChiTietForm form={chiTiet} onBack={() => setChiTiet(null)} />
            )}
        </div>
    );
};

export default KetQuaLop12;
