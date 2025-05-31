import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import CapNhatChuyenNganh from "./Details/CapNhatChuyenNganh";
// import "./NganhHoc.css";

interface NganhHoc {
  MaNganhHoc: number;
  TenNganhHoc: string;
  DiemDau: number;
  DiemTHPTQG?: number;
  DiemHocBa?: number;
  DiemDGNL?: number;
  TrangThai: number;
  ChuyenNganh?: boolean;
}

interface KhoiXetTuyen {
  MaKhoi: string;
  TenMon: string[];
}

interface ChuyenNganh {
  MaChuyenNganh: number;
  TenChuyenNganh: string;
  KhoiXetTuyen?: string[];
}

const KhoiXetTuyenDetail: React.FC<{
  maNganh: number; // MaNganhHoc
  khoiXetTuyenData: Record<number, KhoiXetTuyen[]>;
  onBack: () => void;
}> = ({ maNganh, khoiXetTuyenData, onBack }) => {
  const [maKhoiCu, setMaKhoiCu] = useState(""); // Mã khối cũ muốn đổi
  const [maKhoiMoi, setMaKhoiMoi] = useState(""); // Mã khối mới nhập vào
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!maKhoiCu || !maKhoiMoi) {
      setMessage("Vui lòng nhập đầy đủ mã khối cũ và mã khối mới.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/cap-nhat-khoi-nganh/${maNganh}/${maKhoiCu}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ MaKhoiMoi: maKhoiMoi }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(`Lỗi: ${errorData.detail || "Cập nhật thất bại"}`);
        return;
      }

      const data = await response.json();
      setMessage(data.message || "Cập nhật thành công!");
    } catch (error) {
      setMessage(
        "Lỗi khi gọi API: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: "10px" }}>
        🔙 Quay lại danh sách ngành
      </button>

      <h4>
        Khối xét tuyển của ngành{" "}
        <span className="text-blue-600 font-bold">{maNganh}</span>
      </h4>

      {khoiXetTuyenData[maNganh]?.length > 0 ? (
        <div className="overflow-auto max-w-full max-h-[48vh]">
          <table className="w-full">
            <thead>
              <tr>
                <th>Mã Khối</th>
                <th>Môn học</th>
                <th>Chọn làm khối cũ</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {khoiXetTuyenData[maNganh].map((khoi, index) => (
                <tr key={index}>
                  <td>{khoi.MaKhoi}</td>
                  <td>
                    <ul>
                      {khoi.TenMon.map((mon, idx) => (
                        <li key={idx}>{mon}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <button
                      onClick={() => setMaKhoiCu(khoi.MaKhoi)}
                      className={
                        maKhoiCu === khoi.MaKhoi
                          ? "bg-blue-500 text-white px-2 py-1 rounded"
                          : "bg-gray-200 px-2 py-1 rounded"
                      }
                    >
                      {maKhoiCu === khoi.MaKhoi ? "Đang chọn" : "Chọn"}
                    </button>
                  </td>
                  <td>
                    <button className="text-red-500">🗑 Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>⏳ Đang tải môn học hoặc không có dữ liệu...</p>
      )}
      <div className="shadow-md rounded-2xl px-5 py-4 bg-white">
        <h3 className="font-bold text-lg mb-3">
          ➕ Cập nhật Mã Khối Xét Tuyển
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block mb-1">
                Mã khối cũ (chọn ở trên hoặc nhập lại):
              </label>
              <input
                className="border rounded-md px-2 py-1"
                type="text"
                value={maKhoiCu}
                onChange={(e) => setMaKhoiCu(e.target.value)}
                required
                placeholder="Mã khối cũ"
              />
            </div>
            <div>
              <label className="block mb-1">Mã khối mới:</label>
              <input
                className="border rounded-md px-2 py-1"
                type="text"
                value={maKhoiMoi}
                onChange={(e) => setMaKhoiMoi(e.target.value)}
                required
                placeholder="Mã khối mới"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="bg-blue-500 hover:bg-blue-800 text-white"
          >
            Cập nhật mã khối
          </Button>
        </form>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

const ChuyenNganhDetail: React.FC<{
  maNganh: number;
  chuyenNganhData: Record<number, ChuyenNganh[]>;
  onBack: () => void;
  onReload: () => void;
}> = ({ maNganh, chuyenNganhData, onBack, onReload }) => {
  const [maChuyenNganh, setMaChuyenNganh] = useState("");
  const [tenChuyenNganh, setTenChuyenNganh] = useState("");
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(true); // trạng thái Thêm mới hay Cập nhật

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!maChuyenNganh || !tenChuyenNganh) {
      setMessage(
        "Vui lòng nhập đầy đủ mã chuyên ngành và tên chuyên ngành mới"
      );
      return;
    }

    try {
      let response;
      if (isAdding) {
        // Gửi POST tạo mới chuyên ngành theo ngành học
        response = await fetch(
          `http://localhost:8000/api/nganh-hoc/${maNganh}/create-chuyen-nganh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              MaChuyenNganh: Number(maChuyenNganh),
              TenChuyenNganh: tenChuyenNganh,
            }),
          }
        );
      } else {
        // Gửi PUT cập nhật chuyên ngành
        response = await fetch(
          `http://localhost:8000/cap-nhat-chuyen-nganh/${maChuyenNganh}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ TenChuyenNganh: tenChuyenNganh }),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(
          `Lỗi: ${errorData.detail || errorData.error || "Thao tác thất bại"}`
        );
        return;
      }

      const data = await response.json();
      setMessage(data.message || "Thao tác thành công!");
      setMaChuyenNganh("");
      setTenChuyenNganh("");
      onReload();
      // Có thể thêm code để refresh dữ liệu chuyên ngành nếu cần
    } catch (error) {
      setMessage(
        "Lỗi khi gọi API: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div>
      <Button
        onClick={onBack}
        style={{ marginBottom: "10px" }}
        variant="outline"
      >
        🔙 Quay lại danh sách ngành
      </Button>
      <h4 className="font-bold">Chuyên ngành của ngành {maNganh}</h4>

      {chuyenNganhData[maNganh]?.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên chuyên ngành</th>
              <th>Mã chuyên ngành</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {chuyenNganhData[maNganh].map((chuyen, index) => (
              <tr key={chuyen.MaChuyenNganh}>
                <td>{index + 1}</td>
                <td>{chuyen.TenChuyenNganh}</td>
                <td>{chuyen.MaChuyenNganh}</td>
                <td>
                  <button className="text-red-500" type="button">
                    🗑 Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="my-10 p-4 border">
          ⏳ Đang tải chuyên ngành hoặc không có dữ liệu...
        </p>
      )}

      <div className="shadow-md rounded-2xl px-5 py-4 bg-white">
        <h3 className="font-bold text-lg mb-3">
          ➕ Thêm / Cập nhật Chuyên Ngành
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block mb-1">Mã chuyên ngành:</label>
              <input
                className="border rounded-md px-2 py-1"
                type="number"
                value={maChuyenNganh}
                onChange={(e) => setMaChuyenNganh(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Tên chuyên ngành:</label>
              <input
                className="border rounded-md px-2 py-1"
                type="text"
                value={tenChuyenNganh}
                onChange={(e) => setTenChuyenNganh(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <label>
              <input
                type="radio"
                name="actionType"
                checked={isAdding}
                onChange={() => setIsAdding(true)}
              />{" "}
              Thêm mới chuyên ngành
            </label>{" "}
            <label>
              <input
                type="radio"
                name="actionType"
                checked={!isAdding}
                onChange={() => setIsAdding(false)}
              />{" "}
              Cập nhật chuyên ngành
            </label>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="bg-blue-500 hover:bg-blue-800 text-white"
          >
            {isAdding ? "Thêm chuyên ngành" : "Cập nhật chuyên ngành"}
          </Button>
        </form>
      </div>

      {message && <p className="mt-4 text-green-800">{message}</p>}
    </div>
  );
};

const NganhHoc: React.FC = () => {
  const [nganhHocList, setNganhHocList] = useState<NganhHoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [khoiXetTuyenData, setKhoiXetTuyenData] = useState<
    Record<number, KhoiXetTuyen[]>
  >({});
  const [chuyenNganhData, setChuyenNganhData] = useState<
    Record<number, ChuyenNganh[]>
  >({});
  const [viewingKhoi, setViewingKhoi] = useState<number | null>(null);
  const [viewingChuyenNganh, setViewingChuyenNganh] = useState<number | null>(
    null
  );
  const [newNganh, setNewNganh] = useState({
    MaNganhHoc: "",
    TenNganhHoc: "",
    DiemDau: "",
  });
  const [editMode, setEditMode] = useState<{
    isEditing: boolean;
    editedNganh?: NganhHoc;
  }>({
    isEditing: false,
  });

  useEffect(() => {
    fetchData();
  }, []);
  const [editedNganh, setEditedNganh] = React.useState<NganhHoc | null>(null);

  React.useEffect(() => {
    if (editMode.isEditing && editMode.editedNganh) {
      setEditedNganh(editMode.editedNganh);
    } else {
      setEditedNganh(null);
    }
  }, [editMode]);
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/nganh-hoc");
      if (!response.ok) {
        throw new Error("Lỗi khi tải dữ liệu ngành học");
      }
      const data = await response.json();
      setNganhHocList(data || []);
    } catch (err) {
      console.error("Lỗi khi tải ngành học:", err);
      setError("Không thể tải dữ liệu ngành học.");
    } finally {
      setLoading(false);
    }
  };

  const loadKhoiXetTuyen = async (maNganh: number) => {
    if (khoiXetTuyenData[maNganh]) {
      setViewingKhoi(maNganh);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/mon-hoc-theo-nganh?ma_nganh=${maNganh}`
      );
      if (!response.ok) {
        throw new Error(`Lỗi khi tải môn học cho ngành ${maNganh}`);
      }
      const data = await response.json();

      const khoiMonHocMap: KhoiXetTuyen[] = [];
      data.forEach((item: any) => {
        item.KhoiXetTuyen.forEach((khoi: any) => {
          const tenMonList = khoi.MonHocs.map((mon: any) => mon.TenMonHoc);
          khoiMonHocMap.push({
            MaKhoi: khoi.MaKhoi,
            TenMon: tenMonList,
          });
        });
      });

      setKhoiXetTuyenData((prev) => ({
        ...prev,
        [maNganh]: khoiMonHocMap,
      }));

      setViewingKhoi(maNganh);
    } catch (err) {
      console.error(`Lỗi khi tải môn học cho ngành ${maNganh}:`, err);
      setKhoiXetTuyenData((prev) => ({
        ...prev,
        [maNganh]: [],
      }));
      setViewingKhoi(maNganh);
    }
  };

  const loadChuyenNganh = async (maNganh: number, forceReload = false) => {
    // Nếu đã có dữ liệu và không yêu cầu reload lại thì trả về luôn
    if (!forceReload && chuyenNganhData[maNganh]) {
      setViewingChuyenNganh(maNganh);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/chuyen-nganh-theo-nganh?ma_nganh=${maNganh}`
      );
      if (!response.ok) {
        throw new Error(`Lỗi khi tải chuyên ngành cho ngành ${maNganh}`);
      }
      const data = await response.json();

      const chuyenNganhList: ChuyenNganh[] = data.map((item: any) => ({
        MaChuyenNganh: item.MaChuyenNganh,
        TenChuyenNganh: item.TenChuyenNganh,
      }));

      setChuyenNganhData((prev) => ({
        ...prev,
        [maNganh]: chuyenNganhList,
      }));

      setViewingChuyenNganh(maNganh);
    } catch (err) {
      console.error(`Lỗi khi tải chuyên ngành cho ngành ${maNganh}:`, err);
      setChuyenNganhData((prev) => ({
        ...prev,
        [maNganh]: [],
      }));
      setViewingChuyenNganh(maNganh);
    }
  };

  const handleReload = () => {
    if (viewingChuyenNganh !== null) {
      loadChuyenNganh(viewingChuyenNganh, true); // Gọi với forceReload=true để tải lại dữ liệu
    }
  };

  const handleStatusChange = async (maNganhHoc: number, checked: boolean) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:8000/nganh-hoc/${maNganhHoc}/trang-thai`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ TrangThai: checked ? 1 : 0 }),
        }
      );
      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật trạng thái ngành học");
      }
      setNganhHocList((prev) =>
        prev.map((nganh) =>
          nganh.MaNganhHoc === maNganhHoc
            ? { ...nganh, TrangThai: checked ? 1 : 0 }
            : nganh
        )
      );
    } catch (err) {
      alert("Không thể cập nhật trạng thái ngành học.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedNganh((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editedNganh) return;

    const MaNganhHoc = Number(editedNganh.MaNganhHoc);
    const TenNganhHoc = editedNganh.TenNganhHoc?.trim() || "";
    const DiemDau = Number(editedNganh.DiemDau);
    const DiemTHPTQG =
      String(editedNganh.DiemTHPTQG ?? "") === ""
        ? null
        : Number(editedNganh.DiemTHPTQG);
    const DiemDGNL =
      String(editedNganh.DiemDGNL ?? "") === ""
        ? null
        : Number(editedNganh.DiemDGNL);

    if (!MaNganhHoc || !TenNganhHoc || isNaN(DiemDau)) {
      alert(
        "Vui lòng điền đủ thông tin Mã ngành, Tên ngành và Điểm đầu hợp lệ!"
      );
      return;
    }

    const data = {
      MaNganhHoc,
      TenNganhHoc,
      DiemDau,
      DiemTHPTQG,
      DiemDGNL,
    };

    try {
      const res = await fetch(`http://localhost:8000/api/update-nganh-hoc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 404) {
        alert("Ngành học không tồn tại để cập nhật");
        return;
      }

      if (res.status >= 400) {
        const errorData = await res.json();
        alert("Lỗi: " + (errorData.error || "Có lỗi khi cập nhật"));
        return;
      }

      const resData = await res.json();

      alert(resData.message || "Cập nhật thành công!");
      setEditMode({ isEditing: false });
      fetchData();
      // Có thể gọi lại API lấy danh sách mới hoặc cập nhật state danh sách ở đây
    } catch (err) {
      console.error("Error:", err);
      alert("Có lỗi xảy ra khi gọi API");
    }
  };

  const handleDelete = async (maNganhHoc: number) => {
    const confirmation = window.confirm(
      "Bạn có chắc chắn muốn xóa ngành học này?"
    );
    if (confirmation) {
      setIsProcessing(true);
      try {
        const response = await fetch(
          `http://localhost:8000/nganh-hoc/${maNganhHoc}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          throw new Error("Lỗi khi xóa ngành học");
        }
        setNganhHocList((prev) =>
          prev.filter((nganh) => nganh.MaNganhHoc !== maNganhHoc)
        );
      } catch (err) {
        alert("Không thể xóa ngành học.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddNganh = async (e: React.FormEvent) => {
    e.preventDefault();

    const nganhToSubmit = {
      ...newNganh,
      MaBacHoc: 1, // Hoặc tùy chỉnh từ props/state
      TrangThai: 1,
    };

    try {
      const response = await fetch("http://localhost:8000/api/nganh-hoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nganhToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi thêm ngành học");
      }

      fetchData(); // Re-fetch the data to update the list
      setNewNganh({ MaNganhHoc: "", TenNganhHoc: "", DiemDau: "" });
    } catch (error) {
      console.error("Lỗi:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Đã xảy ra lỗi không xác định.");
      }
    }
  };

  const filteredList = useMemo(
    () =>
      nganhHocList.filter(
        (nganh) =>
          String(nganh.MaNganhHoc)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          nganh.TenNganhHoc.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [nganhHocList, searchTerm]
  );

  // Add this function before the return statement
  const handleEdit = (nganh: NganhHoc) => {
    console.log(nganh);
    setEditMode({ isEditing: true, editedNganh: nganh });
  };

  return (
    <div className="relative h-full">
      <h2 className="font-bold">📚 Danh sách Ngành học</h2>

      {viewingKhoi !== null ? (
        <KhoiXetTuyenDetail
          maNganh={viewingKhoi}
          khoiXetTuyenData={khoiXetTuyenData}
          onBack={() => setViewingKhoi(null)}
        />
      ) : viewingChuyenNganh !== null ? (
        <ChuyenNganhDetail
          maNganh={viewingChuyenNganh}
          chuyenNganhData={chuyenNganhData}
          onBack={() => setViewingChuyenNganh(null)}
          onReload={handleReload}
        />
      ) : (
        <>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm mã ngành hoặc tên ngành..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px",
              width: "300px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
          />
          {loading ? (
            <p>⏳ Đang tải dữ liệu...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <div className="overflow-auto max-w-full max-h-[50vh]">
              <table className="w-full">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[35%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Mã Ngành</th>
                    <th>Tên Ngành</th>
                    {/* <th>Điểm ĐGNL</th>
                    <th>Điểm THPTQG</th> */}
                    <th>Điểm Học Bạ</th>
                    <th>Trạng Thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList
                    .slice()
                    .reverse()
                    .map((nganh) => (
                      <tr key={nganh.MaNganhHoc}>
                        <td>{nganh.MaNganhHoc}</td>
                        <td>{nganh.TenNganhHoc}</td>
                        {/* <td>{nganh.DiemDGNL ?? "—"}</td>
                      <td>{nganh.DiemDau}</td> */}
                        <td>{nganh.DiemDau}</td>

                        <td>
                          <input
                            type="checkbox"
                            checked={nganh.TrangThai === 1}
                            disabled={isProcessing}
                            onChange={(e) =>
                              handleStatusChange(
                                nganh.MaNganhHoc,
                                e.target.checked
                              )
                            }
                          />
                        </td>

                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadKhoiXetTuyen(nganh.MaNganhHoc)}
                            >
                              📘 Khối
                            </button>
                            <button
                              onClick={() => loadChuyenNganh(nganh.MaNganhHoc)}
                            >
                              🧭 Chuyên ngành
                            </button>
                            <button onClick={() => handleEdit(nganh)}>
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(nganh.MaNganhHoc)}
                            >
                              🗑 Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {editMode.isEditing && editedNganh ? (
            <form
              onSubmit={handleSaveEdit}
              className="edit-form absolute bottom-0 -left-5 right-0 shadow-md rounded-2xl px-5 py-4 bg-white"
            >
              <h3 className="font-bold text-lg mb-3">📝 Chỉnh sửa Ngành học</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  className="border rounded-md px-2 py-1"
                  type="text"
                  name="MaNganhHoc"
                  value={editedNganh.MaNganhHoc}
                  readOnly
                />
                <input
                  className="border rounded-md px-2 py-1"
                  type="text"
                  name="TenNganhHoc"
                  value={editedNganh.TenNganhHoc}
                  onChange={handleInputChange}
                  placeholder="Tên ngành"
                />
                <input
                  className="border rounded-md px-2 py-1"
                  type="number"
                  name="DiemDau"
                  value={editedNganh.DiemDau}
                  onChange={handleInputChange}
                  placeholder="Điểm đầu"
                />
                {/* <input
                  className="border rounded-md px-2 py-1"
                  type="number"
                  name="DiemTHPTQG"
                  value={editedNganh.DiemTHPTQG ?? ""}
                  onChange={handleInputChange}
                  placeholder="Điểm THPTQG"
                />
                <input
                  className="border rounded-md px-2 py-1"
                  type="number"
                  name="DiemDGNL"
                  value={editedNganh.DiemDGNL ?? ""}
                  onChange={handleInputChange}
                  placeholder="Điểm ĐGNL"
                /> */}
                <Button type="submit" variant="outline">
                  💾 Lưu
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  onClick={() => {
                    setEditMode({ isEditing: false });
                    setNewNganh({
                      MaNganhHoc: "",
                      TenNganhHoc: "",
                      DiemDau: "",
                    });
                  }}
                >
                  ❌ Hủy
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleAddNganh}
              className="edit-form absolute bottom-0 -left-5 right-0 w-full shadow-md rounded-2xl px-5 py-4 bg-white"
            >
              <h3 className="font-bold text-lg mb-3">➕ Thêm Ngành học mới</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="MaNganhHoc"
                  maxLength={7}
                  className="border rounded-md px-2 py-1"
                  placeholder="Mã ngành học"
                  required
                  value={newNganh.MaNganhHoc}
                  onChange={(e) =>
                    setNewNganh({ ...newNganh, MaNganhHoc: e.target.value })
                  }
                />

                <input
                  type="text"
                  name="TenNganhHoc"
                  className="border rounded-md px-2 py-1"
                  placeholder="Tên ngành học"
                  required
                  value={newNganh.TenNganhHoc}
                  onChange={(e) =>
                    setNewNganh({ ...newNganh, TenNganhHoc: e.target.value })
                  }
                />

                <input
                  type="number"
                  name="DiemDau"
                  className="border rounded-md px-2 py-1"
                  placeholder="Điểm đầu"
                  required
                  value={newNganh.DiemDau}
                  onChange={(e) =>
                    setNewNganh({ ...newNganh, DiemDau: e.target.value })
                  }
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-800">
                  Thêm ngành
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default NganhHoc;
