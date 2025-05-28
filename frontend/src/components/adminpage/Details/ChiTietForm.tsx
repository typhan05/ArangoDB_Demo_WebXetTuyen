import React from "react";

interface ChiTietProps {
    form: any;
    onBack: () => void;
}

const genderLabel = (g: string) => (g === "1" ? "Nam" : "Nữ");
const duHocLabel = (val: string) => (val === "1" ? "Có" : "Không");

const ChiTietForm: React.FC<ChiTietProps> = ({ form, onBack }) => {
    return (
        <div>
            <h2>Chi tiết Form: {form.MaForm}</h2>
            <table border={1} cellPadding={8} cellSpacing={0}>
                <tbody>
                    <tr><td><strong>Họ tên</strong></td><td>{form.HoTen}</td></tr>
                    <tr><td><strong>Ngày sinh</strong></td><td>{form.NgaySinh}</td></tr>
                    <tr><td><strong>Giới tính</strong></td><td>{genderLabel(form.GioiTinh)}</td></tr>
                    <tr><td><strong>CCCD</strong></td><td>{form.CCCD}</td></tr>
                    <tr><td><strong>Email</strong></td><td>{form.Email}</td></tr>
                    <tr><td><strong>SĐT</strong></td><td>{form.SoDienThoai}</td></tr>
                    <tr><td><strong>Địa chỉ</strong></td><td>{form.DiaChi}</td></tr>
                    {/* Thay thế dòng này */}
                    <tr><td><strong>Tên trường</strong></td><td>{form.TenTruong}</td></tr>
                    <tr><td><strong>Điểm thi</strong></td><td>{form.DiemThi}</td></tr>
                    <tr><td><strong>Năm tốt nghiệp</strong></td><td>{form.NamTotNghiep}</td></tr>
                    <tr><td><strong>Nguyện vọng du học</strong></td><td>{duHocLabel(form.CoNguyenVongDuHoc)}</td></tr>
                    <tr><td><strong>Ngày đăng ký</strong></td><td>{form.NgayDangKy}</td></tr>
                    <tr>
                        <td><strong>Kết quả</strong></td>
                        <td style={{ fontWeight: "bold", color: form.Ketqua === "1" ? "green" : "red" }}>
                            {form.Ketqua === "1" ? "Đậu" : "Rớt"}
                        </td>
                    </tr>
                </tbody>
            </table>
            <br />
            <button
                onClick={onBack}
                style={{ padding: "8px 12px", backgroundColor: "#ddd", border: "1px solid #ccc", cursor: "pointer" }}
            >
                ← Quay lại danh sách
            </button>
        </div>
    );
};

export default ChiTietForm;
