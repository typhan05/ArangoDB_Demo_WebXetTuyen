import { useState } from "react";

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
                <li onClick={() => setActiveMenu("nhomMonHoc")}>
                  📂 Nhóm môn học - Môn học
                </li>
                <li onClick={() => setActiveMenu("khuVucUuTien")}>
                  💾 Khu vực ưu tiên
                </li>
                <li onClick={() => setActiveMenu("doiTuongUuTien")}>
                  ℹ️ Đối tượng ưu tiên
                </li>
                <li onClick={() => setActiveMenu("nganhHoc")}>📚 Ngành học</li>
                <li onClick={() => setActiveMenu("nhapDuLieu")}>
                  📥 Nhập dữ liệu trúng tuyển
                </li>
                <li onClick={() => setActiveMenu("suaDuLieu")}>
                  📊 Sửa bảng dữ liệu trúng tuyển
                </li>
              </ul>
            )}

            <li onClick={() => setActiveMenu("news")}>📋 Quản lý tin tức</li>

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
                <li onClick={() => setActiveMenu("hocBa")}>📄 Theo học bạ</li>
                <li onClick={() => setActiveMenu("thpt")}>
                  🏆 Theo kết quả thi THPT Quốc gia
                </li>
                <li onClick={() => setActiveMenu("lop12")}>
                  📑 Theo kết quả lớp 12
                </li>
                <li onClick={() => setActiveMenu("diemMax")}>
                  📊 Xét tuyển dựa vào điểm MAX
                </li>
              </ul>
            )}

            <li onClick={() => setActiveMenu("users")}>
              👤 Quản lý người dùng
            </li>
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
                <li onClick={() => setActiveMenu("nhomMonHoc")}>
                  <span className="icon">📂</span>
                  Nhóm môn học - Môn học
                </li>
                <li onClick={() => setActiveMenu("khuVucUuTien")}>
                  <span className="icon">💾</span>
                  Khu vực ưu tiên
                </li>
                <li onClick={() => setActiveMenu("doiTuongUuTien")}>
                  <span className="icon">ℹ️</span>
                  Đối tượng ưu tiên
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

          {/* Kết quả đăng ký xét tuyển */}
          {activeMenu === "results" && (
            <div>
              <h2>📊 Kết quả đăng ký xét tuyển</h2>
              <ul className="submenu-content">
                <li onClick={() => setActiveMenu("hocBa")}>📄 Theo học bạ</li>
                <li onClick={() => setActiveMenu("thpt")}>
                  🏆 Theo kết quả thi THPT Quốc gia
                </li>
                <li onClick={() => setActiveMenu("lop12")}>
                  📑 Theo kết quả lớp 12
                </li>
                <li onClick={() => setActiveMenu("diemMax")}>
                  📊 Xét tuyển dựa vào điểm MAX
                </li>
              </ul>
            </div>
          )}

          {/* Nội dung submenu quản lý thông tin */}
          {activeMenu === "dotXetTuyen" && (
            <h2>👁️ Đợt xét tuyển - Hiển thị kết quả</h2>
          )}
          {activeMenu === "danhSachTinh" && (
            <h2>🏫 Danh sách tỉnh - Trường THPT</h2>
          )}
          {activeMenu === "nhomMonHoc" && <h2>📂 Nhóm môn học - Môn học</h2>}
          {activeMenu === "khuVucUuTien" && <h2>💾 Khu vực ưu tiên</h2>}
          {activeMenu === "doiTuongUuTien" && <h2>ℹ️ Đối tượng ưu tiên</h2>}
          {activeMenu === "nganhHoc" && <h2>📚 Ngành học</h2>}
          {activeMenu === "nhapDuLieu" && <h2>📥 Nhập dữ liệu trúng tuyển</h2>}
          {activeMenu === "suaDuLieu" && (
            <h2>📊 Sửa bảng dữ liệu trúng tuyển</h2>
          )}

          {/* Nội dung kết quả xét tuyển */}
          {activeMenu === "hocBa" && <h2>📄 Xét tuyển theo học bạ</h2>}
          {activeMenu === "thpt" && (
            <h2>🏆 Xét tuyển theo kết quả thi THPT Quốc gia</h2>
          )}
          {activeMenu === "lop12" && <h2>📑 Xét tuyển theo kết quả lớp 12</h2>}
          {activeMenu === "diemMax" && <h2>📊 Xét tuyển dựa vào điểm MAX</h2>}

          {activeMenu === "news" && <h2>📋 Quản lý tin tức</h2>}
          {activeMenu === "users" && <h2>👤 Quản lý người dùng</h2>}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
