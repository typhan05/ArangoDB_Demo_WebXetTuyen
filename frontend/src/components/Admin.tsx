import { useState } from "react";
import NganhHoc from "./adminpage/NganhHoc"; // Import NganhHoc component
import DanhSachTinh from "./adminpage/DanhSachTinh"; // Import DanhSachTinh component
import KhoiXetTuyenMonHoc from "./adminpage/KhoiXetTuyenMonHoc"; // Import KhoiXetTuyenMonHoc component
import KetQuaLop12 from "./adminpage/KetQuaLop12"; // Import KetQuaLop12 component
import DotXetTuyen from "./adminpage/DotXetTuyen";
import CapNhatChuyenNganh from "./adminpage/Details/CapNhatChuyenNganh";
const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("home"); // Mặc định là Trang chủ
  const [isInfoOpen, setIsInfoOpen] = useState(false); // Trạng thái mở Quản lý thông tin
  const [isResultsOpen, setIsResultsOpen] = useState(false); // Trạng thái mở Kết quả xét tuyển

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1 className="font-bold text-xl">
          HỆ THỐNG QUẢN TRỊ NỘI DUNG WEBSITE XÉT TUYỂN ONLINE
        </h1>
      </header>

      <div className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <ul className="w-full">
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
                <li onClick={() => setActiveMenu("nhapDuLieu")}>
                  📥 Nhập dữ liệu trúng tuyển
                </li>
                <li onClick={() => setActiveMenu("suaDuLieu")}>
                  📊 Sửa bảng dữ liệu trúng tuyển
                </li>
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
                <li onClick={() => setActiveMenu("lop12")}>
                  📑 Theo kết quả lớp 12
                </li>
              </ul>
            )}
          </ul>
        </aside>

        {/* Nội dung chính */}
        <div className="admin-content">
          {activeMenu === "home" && (
            <div>
              <h2 className="font-bold">🏠 Trang chủ</h2>
              <ul className="grid grid-cols-6 gap-4">
                <li
                  className="rounded-md border border-black p-4 text-center cursor-pointer"
                  onClick={() => {
                    setIsInfoOpen(!isInfoOpen);
                    setActiveMenu("info"); // Hiển thị nội dung Quản lý thông tin
                  }}
                >
                  <svg
                    className="svg-inline--fa fa-file-lines nav-item-icon max-w-8 mx-auto mb-2"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="far"
                    data-icon="file-lines"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                    data-fa-i2svg=""
                  >
                    <path
                      fill="currentColor"
                      d="M64 464c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16H224v80c0 17.7 14.3 32 32 32h80V448c0 8.8-7.2 16-16 16H64zM64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V154.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0H64zm56 256c-13.3 0-24 10.7-24 24s10.7 24 24 24H264c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm0 96c-13.3 0-24 10.7-24 24s10.7 24 24 24H264c13.3 0 24-10.7 24-24s-10.7-24-24-24H120z"
                    />
                  </svg>
                  <span className="text-lg font-bold">Quản lý thông tin</span>
                </li>
                <li
                  className="rounded-md border border-black p-4 text-center cursor-pointer"
                  onClick={() => {
                    setIsResultsOpen(!isResultsOpen);
                    setActiveMenu("lop12");
                    // setActiveMenu("results");
                  }}
                >
                  <svg
                    className="svg-inline--fa fa-address-card nav-item-icon max-w-12 mx-auto mb-2"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="far"
                    data-icon="address-card"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    data-fa-i2svg=""
                  >
                    <path
                      fill="currentColor"
                      d="M512 80c8.8 0 16 7.2 16 16V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16H512zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM208 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128zm-32 32c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16H304c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80H176zM376 144c-13.3 0-24 10.7-24 24s10.7 24 24 24h80c13.3 0 24-10.7 24-24s-10.7-24-24-24H376zm0 96c-13.3 0-24 10.7-24 24s10.7 24 24 24h80c13.3 0 24-10.7 24-24s-10.7-24-24-24H376z"
                    />
                  </svg>
                  <span className="text-lg font-bold">Kết Quả Xét Tuyển</span>
                </li>
                <li className="rounded-md border border-black p-4 text-center pointer-events-none cursor-not-allowed opacity-50">
                  <svg
                    className="svg-inline--fa fa-circle-user nav-item-icon max-w-12 mx-auto mb-2"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="circle-user"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    data-fa-i2svg=""
                  >
                    <path
                      fill="currentColor"
                      d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z"
                    />
                  </svg>
                  <span className="text-lg font-bold">Quản lý người dùng</span>
                </li>
              </ul>
            </div>
          )}
          {/* Quản lý thông tin */}
          {activeMenu === "info" && (
            <div>
              <h2 className="font-bold">📂 Quản lý thông tin</h2>
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
          {activeMenu === "dotXetTuyen" && <DotXetTuyen />}
          {activeMenu === "danhSachTinh" && <DanhSachTinh />}
          {activeMenu === "danhSachMon" && <KhoiXetTuyenMonHoc />}{" "}
          {/* Hiển thị danh sách môn học */}
          {activeMenu === "nganhHoc" && <NganhHoc />}
          {activeMenu === "lop12" && <KetQuaLop12 />}
          {/* Các nội dung khác như đã được định nghĩa */}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
