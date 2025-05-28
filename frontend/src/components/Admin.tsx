import { useState } from "react";
import NganhHoc from './adminpage/NganhHoc'; // Import NganhHoc component
import DanhSachTinh from './adminpage/DanhSachTinh'; // Import DanhSachTinh component
import KhoiXetTuyenMonHoc from './adminpage/KhoiXetTuyenMonHoc'; // Import KhoiXetTuyenMonHoc component
import KetQuaLop12 from './adminpage/KetQuaLop12'; // Import KetQuaLop12 component
const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("home"); // Mặc định là Trang chủ
  const [isInfoOpen, setIsInfoOpen] = useState(false); // Trạng thái mở Quản lý thông tin
  const [isResultsOpen, setIsResultsOpen] = useState(false); // Trạng thái mở Kết quả xét tuyển

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1>HỆ THỐNG QUẢN TRỊ NỘI DUNG WEBSITE XÉT TUYỂN ONLINE</h1>
      </header>

      <div className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <ul>
            <li onClick={() => setActiveMenu("home")}>🏠 Trang chủ</li>

            {/* Quản lý thông tin */}
            <li
              className={`menu-item ${isInfoOpen ? "active" : ""}`}
              onClick={() => {
                setIsInfoOpen(!isInfoOpen);
                setActiveMenu("info"); // Hiển thị nội dung Quản lý thông tin
              }}
            >
              📂 Quản lý thông tin
            </li>
            {isInfoOpen && (
              <ul className="submenu">
                <li onClick={() => setActiveMenu("dotXetTuyen")}>
                  👁️ Đợt xét tuyển - Hiển thị kết quả
                </li>
                <li onClick={() => setActiveMenu("danhSachTinh")}>
                  🏫 Danh sách tỉnh - Trường THPT
                </li>
                <li onClick={() => setActiveMenu("danhSachMon")}>
                  📘 Danh sách môn học
                </li>
                <li onClick={() => setActiveMenu("nganhHoc")}>📚 Ngành học</li>
                <li onClick={() => setActiveMenu("nhapDuLieu")}>📥 Nhập dữ liệu trúng tuyển</li>
                <li onClick={() => setActiveMenu("suaDuLieu")}>📊 Sửa bảng dữ liệu trúng tuyển</li>
              </ul>
            )}



            {/* Kết quả đăng ký xét tuyển */}
            <li
              className={`menu-item ${isResultsOpen ? "active" : ""}`}
              onClick={() => {
                setIsResultsOpen(!isResultsOpen);
                setActiveMenu("results");
              }}
            >
              📊 Kết quả đăng ký xét tuyển
            </li>
            {isResultsOpen && (
              <ul className="submenu">


                <li onClick={() => setActiveMenu("lop12")}>📑 Theo kết quả lớp 12</li>

              </ul>
            )}


          </ul>
        </aside>

        {/* Nội dung chính */}
        <div className="admin-content">
          {activeMenu === "home" && <h2>🏠 Trang chủ</h2>}

          {/* Quản lý thông tin */}
          {activeMenu === "info" && (
            <div>
              <h2>📂 Quản lý thông tin</h2>
              <ul className="submenu-content">
                <li onClick={() => setActiveMenu("dotXetTuyen")}>
                  <span className="icon">👁️</span>
                  Đợt xét tuyển - Hiển thị kết quả
                </li>
                <li onClick={() => setActiveMenu("danhSachTinh")}>
                  <span className="icon">🏫</span>
                  Danh sách tỉnh - Trường THPT
                </li>
                <li onClick={() => setActiveMenu("danhSachMon")}>
                  <span className="icon">📘</span>
                  Nhóm môn học - môn học
                </li>
                <li onClick={() => setActiveMenu("nganhHoc")}>
                  <span className="icon">📚</span>
                  Ngành học
                </li>
                <li onClick={() => setActiveMenu("nhapDuLieu")}>
                  <span className="icon">📥</span>
                  Nhập dữ liệu trúng tuyển
                </li>
                <li onClick={() => setActiveMenu("suaDuLieu")}>
                  <span className="icon">📊</span>
                  Sửa bảng dữ liệu trúng tuyển
                </li>
              </ul>
            </div>
          )}

          {/* Nội dung submenu quản lý thông tin */}
          {activeMenu === "danhSachTinh" && <DanhSachTinh />}
          {activeMenu === "danhSachMon" && <KhoiXetTuyenMonHoc />} {/* Hiển thị danh sách môn học */}
          {activeMenu === "nganhHoc" && <NganhHoc />}
          {activeMenu === "lop12" && <KetQuaLop12 />}

          {/* Các nội dung khác như đã được định nghĩa */}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
