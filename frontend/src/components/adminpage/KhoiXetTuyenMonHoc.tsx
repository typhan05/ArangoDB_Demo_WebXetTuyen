import React, { useState, useEffect } from "react";

interface MonHoc {
  id: string;
  tenMon: string;
}

interface KhoiXetTuyen {
  maKhoi: string;
  cacMonHoc: MonHoc[];
}
interface DeleteMonHocRequest {
  maKhoi: string;
  tenMonHoc: string;
}
const KhoiXetTuyenMonHoc = () => {
  const [data, setData] = useState<KhoiXetTuyen[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [newMonHoc, setNewMonHoc] = useState<string>("");
  const [editingMonId, setEditingMonId] = useState<string | null>(null);
  const [editedTenMon, setEditedTenMon] = useState<string>("");

  const [newMaKhoi, setNewMaKhoi] = useState<string>("");
  const [editingKhoi, setEditingKhoi] = useState<string | null>(null);
  const [editedMaKhoi, setEditedMaKhoi] = useState<string>("");

  const [showKhoiManagement, setShowKhoiManagement] = useState<boolean>(false);
  const [newMaMonHoc, setNewMaMonHoc] = useState("");
  const [newTenMonHoc, setNewTenMonHoc] = useState("");


  const fetchData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/danh-sach-mon-hoc");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRow = (maKhoi: string) => {
    setShowDetails(showDetails === maKhoi ? null : maKhoi);
    setNewMonHoc("");
  };

  const goBack = () => {
    setShowDetails(null);
    setEditingMonId(null);
    setNewMonHoc("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value === "") setShowDetails(null);
  };

  const handleAddKhoi = async () => {
    if (!newMaKhoi.trim()) return;
    try {
      await fetch("http://127.0.0.1:8000/khoi-xet-tuyen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maKhoi: newMaKhoi }),
      });
      setNewMaKhoi("");
      fetchData();
    } catch (err) {
      console.error("Lỗi khi thêm khối:", err);
    }
  };

  const handleEditKhoi = async (oldMaKhoi: string) => {
    if (!editedMaKhoi.trim()) return;
    try {
      await fetch("http://127.0.0.1:8000/khoi-xet-tuyen/update-by-ma", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoiCu: oldMaKhoi,
          maKhoiMoi: editedMaKhoi,
        }),
      });
      setEditingKhoi(null);
      fetchData();
    } catch (err) {
      console.error("Lỗi khi sửa khối:", err);
    }
  };


  const handleDeleteKhoi = async (maKhoi: string) => {
    try {
      await fetch("http://127.0.0.1:8000/khoixettuyen/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ MaKhoi: maKhoi }),
      });
      fetchData(); // làm mới danh sách sau khi xóa
    } catch (err) {
      console.error("Lỗi khi xóa khối:", err);
    }
  };


  const handleAddMonHoc = async (maKhoi: string, newTenMonHoc: string) => {
    if (!newMaMonHoc.trim() || !newTenMonHoc.trim()) return;
    try {
      await fetch("http://127.0.0.1:8000/mon-hoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoi,       // mã khối
          tenMonHoc: newTenMonHoc // tên môn học
        }),
      });
      // Clear input sau khi thêm
      setNewMaMonHoc("");
      setNewTenMonHoc("");
      fetchData();
    } catch (err) {
      console.error("Lỗi khi thêm môn:", err);
    }
  };


  const handleEditMonHoc = async (maKhoi: string, oldTenMon: string) => {
    try {
      await fetch("http://127.0.0.1:8000/mon-hoc/update-by-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoi: maKhoi,
          tenMonHocCu: oldTenMon,
          tenMonHocMoi: editedTenMon
        }),
      });
      setEditingMonId(null);
      fetchData();
    } catch (err) {
      console.error("Lỗi khi sửa môn:", err);
    }
  };

  const handleDeleteMonHoc = async (maKhoi: string, tenMonHoc: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/monhoc/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ maKhoi, tenMonHoc }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Lỗi khi xóa môn học");
      }

      // Cập nhật lại dữ liệu sau khi xóa
      fetchData();
    } catch (err) {
      console.error("Lỗi khi xóa môn:", err);
    }
  };

  let displayedData = data;
  if (showDetails) {
    displayedData = data.filter((item) => item.maKhoi === showDetails);
  } else if (searchTerm) {
    displayedData = data.filter((item) =>
      item.maKhoi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="p-4">
      {!showKhoiManagement ? (
        <>
          <h2 className="text-lg font-semibold mb-4">Danh Sách Môn Học</h2>

          <input
            type="text"
            placeholder="Tìm kiếm theo mã khối..."
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={!!showDetails}
            className={`mb-4 w-full p-2 border rounded ${showDetails ? "bg-gray-200" : "bg-white"}`}
          />

          {showDetails && (
            <button className="mb-4 px-3 py-1 bg-gray-300 rounded" onClick={goBack}>
              Quay lại
            </button>
          )}

          <table className="table-auto w-full text-sm text-center border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Mã Khối</th>
                <th className="p-2 border">Môn Học</th>
                <th className="p-2 border">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((item) => (
                <React.Fragment key={item.maKhoi}>
                  {showDetails === item.maKhoi ? (
                    <>
                      <tr>
                        <td colSpan={3} className="p-2 border">
                          <input
                            placeholder="Tên môn mới..."
                            value={newMaMonHoc}
                            onChange={(e) => setNewMaMonHoc(e.target.value)}
                            className="p-1 border rounded mr-2"
                          />
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                            onClick={() => handleAddMonHoc(item.maKhoi, newMaMonHoc)}
                          >
                            Thêm môn
                          </button>
                        </td>
                      </tr>
                      {item.cacMonHoc.map((monHoc) => (
                        <tr key={monHoc.id}>
                          <td className="border p-1">{item.maKhoi}</td>
                          <td className="border p-1">
                            {editingMonId === monHoc.id ? (
                              <input
                                value={editedTenMon}
                                onChange={(e) => setEditedTenMon(e.target.value)}
                                className="p-1 border rounded"
                              />
                            ) : (
                              monHoc.tenMon
                            )}
                          </td>
                          <td className="border p-1">
                            {editingMonId === monHoc.id ? (
                              <>
                                <button
                                  className="text-green-600 mr-2"
                                  onClick={() => handleEditMonHoc(item.maKhoi, monHoc.tenMon)}
                                >
                                  Lưu
                                </button>
                                <button onClick={() => setEditingMonId(null)}>Hủy</button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="text-blue-600 mr-2"
                                  onClick={() => {
                                    setEditingMonId(monHoc.id);
                                    setEditedTenMon(monHoc.tenMon);
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="text-red-600"
                                  onClick={() => handleDeleteMonHoc(item.maKhoi, monHoc.tenMon)}
                                >
                                  Xóa
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td className="border p-1">{item.maKhoi}</td>
                      <td className="border p-1">
                        {item.cacMonHoc.map((monHoc) => (
                          <div key={monHoc.id}>{monHoc.tenMon}</div>
                        ))}
                      </td>
                      <td className="border p-1">
                        <button
                          className="text-blue-500 underline"
                          onClick={() => toggleRow(item.maKhoi)}
                        >
                          Xem Chi Tiết
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              setShowKhoiManagement(true);
              setShowDetails(null);
              setSearchTerm("");
            }}
          >
            Quản Lý Mã Khối
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-4">Quản Lý Mã Khối</h2>

          <div className="mb-4">
            <input
              placeholder="Nhập mã khối mới..."
              value={newMaKhoi}
              onChange={(e) => setNewMaKhoi(e.target.value)}
              className="p-2 border rounded mr-2"
            />
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleAddKhoi}>
              Thêm Khối
            </button>
          </div>

          <table className="table-auto w-full text-sm text-center border border-gray-300 mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Mã Khối</th>
                <th className="p-2 border">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((khoi) => (
                <tr key={khoi.maKhoi}>
                  <td className="border p-1">
                    {editingKhoi === khoi.maKhoi ? (
                      <input
                        value={editedMaKhoi}
                        onChange={(e) => setEditedMaKhoi(e.target.value)}
                        className="p-1 border rounded"
                      />
                    ) : (
                      khoi.maKhoi
                    )}
                  </td>
                  <td className="border p-1">
                    {editingKhoi === khoi.maKhoi ? (
                      <>
                        <button
                          className="text-green-600 mr-2"
                          onClick={() => handleEditKhoi(khoi.maKhoi)}
                        >
                          Lưu
                        </button>
                        <button onClick={() => setEditingKhoi(null)}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-blue-600 mr-2"
                          onClick={() => {
                            setEditingKhoi(khoi.maKhoi);
                            setEditedMaKhoi(khoi.maKhoi);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => handleDeleteKhoi(khoi.maKhoi)}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={() => setShowKhoiManagement(false)}>
            Quay lại Danh Sách Môn Học
          </button>
        </>
      )}
    </div>
  );
};

export default KhoiXetTuyenMonHoc;
