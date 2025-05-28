import { useState, useEffect } from "react";

// Định nghĩa kiểu dữ liệu cho Tỉnh và Trường THPT
interface Tinh {
    _id: string;
    MaTinh: string;
    TenTinh: string;
}

interface Truong {
    _id: string;
    TenTruong: string;
}

const TinhTp = () => {
    const [tinhData, setTinhData] = useState<Tinh[]>([]); // Mảng lưu trữ các tỉnh
    const [truongData, setTruongData] = useState<Truong[]>([]); // Mảng lưu trữ các trường THPT
    const [selectedTinh, setSelectedTinh] = useState<string | null>(null); // Tỉnh đã chọn
    const [loading, setLoading] = useState<boolean>(true); // Trạng thái loading
    const [error, setError] = useState<string>(""); // Trạng thái lỗi khi có lỗi xảy ra
    const [editingTinh, setEditingTinh] = useState<Tinh | null>(null); // Tỉnh đang sửa
    const [editingTruong, setEditingTruong] = useState<Truong | null>(null); // Trường đang sửa

    // Gọi API để lấy danh sách các tỉnh
    useEffect(() => {
        const fetchTinhData = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://127.0.0.1:8000/tinh-tp");
                if (!response.ok) {
                    throw new Error("Lỗi khi lấy dữ liệu từ API");
                }
                const data = await response.json();
                setTinhData(data); // Cập nhật dữ liệu tỉnh vào state
            } catch (error: any) {
                setError(error.message); // Cập nhật thông báo lỗi
            } finally {
                setLoading(false); // Dừng trạng thái loading sau khi dữ liệu được lấy
            }
        };

        fetchTinhData();
    }, []); // useEffect chỉ chạy một lần khi component được mount

    // Gọi API khi người dùng chọn tỉnh để lấy dữ liệu trường THPT
    useEffect(() => {
        if (selectedTinh) {
            const fetchTruongData = async () => {
                setLoading(true); // Đặt lại trạng thái loading khi bắt đầu gọi API
                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/truong-thpt?ma_tinh=${selectedTinh}`
                    );
                    if (!response.ok) {
                        throw new Error("Lỗi khi lấy dữ liệu trường THPT");
                    }
                    const data = await response.json();
                    setTruongData(data); // Cập nhật dữ liệu trường THPT vào state
                } catch (error: any) {
                    setError(error.message); // Cập nhật thông báo lỗi
                } finally {
                    setLoading(false); // Dừng trạng thái loading sau khi dữ liệu được lấy
                }
            };

            fetchTruongData();
        } else {
            setTruongData([]); // Xóa dữ liệu trường nếu không có tỉnh được chọn
        }
    }, [selectedTinh]); // useEffect sẽ chạy lại khi `selectedTinh` thay đổi

    // Hàm sửa Tỉnh
    const handleEditTinh = (tinh: Tinh) => {
        setEditingTinh(tinh);
    };

    // Hàm sửa Trường
    const handleEditTruong = (truong: Truong) => {
        setEditingTruong(truong);
    };

    // Hàm lưu sửa Tỉnh
    const handleSaveTinh = async (tinh: Tinh) => {
        if (editingTinh?.TenTinh === tinh.TenTinh) return; // Nếu không có thay đổi, không lưu.
        console.log("Saving Tinh:", tinh); // Log để kiểm tra xem dữ liệu có được truyền vào đúng không

        try {
            const response = await fetch(`http://127.0.0.1:8000/tinh-tp/${tinh._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(tinh),
            });

            if (!response.ok) {
                throw new Error("Không thể cập nhật Tỉnh");
            }

            setTinhData((prevData) =>
                prevData.map((item) =>
                    item._id === tinh._id ? { ...item, TenTinh: tinh.TenTinh } : item
                )
            );
            setEditingTinh(null); // Đóng form chỉnh sửa
            console.log("Tỉnh đã được cập nhật thành công!");
        } catch (error: any) {
            setError(error.message);
            console.error("Lỗi khi cập nhật Tỉnh:", error.message); // Log lỗi nếu có
        }
    };

    // Hàm lưu sửa Trường
    const handleSaveTruong = async (truong: Truong) => {
        if (editingTruong?.TenTruong === truong.TenTruong) return; // Nếu không có thay đổi, không lưu.
        console.log("Saving Truong:", truong); // Log để kiểm tra xem dữ liệu có được truyền vào đúng không

        try {
            const response = await fetch(`http://127.0.0.1:8000/truong-thpt/${truong._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(truong),
            });

            if (!response.ok) {
                throw new Error("Không thể cập nhật Trường");
            }

            setTruongData((prevData) =>
                prevData.map((item) =>
                    item._id === truong._id ? { ...item, TenTruong: truong.TenTruong } : item
                )
            );
            setEditingTruong(null); // Đóng form chỉnh sửa
            console.log("Trường đã được cập nhật thành công!");
        } catch (error: any) {
            setError(error.message);
            console.error("Lỗi khi cập nhật Trường:", error.message); // Log lỗi nếu có
        }
    };

    // Hàm xóa Tỉnh
    const handleDeleteTinh = async (id: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/tinh-tp/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Không thể xóa Tỉnh");
            }

            setTinhData((prevData) => prevData.filter((tinh) => tinh._id !== id));
        } catch (error: any) {
            setError(error.message);
        }
    };

    // Hàm xóa Trường
    const handleDeleteTruong = async (id: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/truong-thpt/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Không thể xóa Trường");
            }

            setTruongData((prevData) => prevData.filter((truong) => truong._id !== id));
        } catch (error: any) {
            setError(error.message);
        }
    };

    if (loading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    // Tìm tên tỉnh từ mã tỉnh đã chọn
    const selectedTinhName = tinhData.find((tinh) => tinh.MaTinh === selectedTinh)?.TenTinh;

    return (
        <div>
            <h2>Danh sách Tỉnh - TP</h2>
            {/* Hiển thị bảng các tỉnh */}
            {!selectedTinh && (
                <table>
                    <thead>
                        <tr>
                            <th>Mã Tỉnh</th>
                            <th>Tên Tỉnh</th>
                            <th>Sửa</th>
                            <th>Xóa</th>
                            <th>Trường THPT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tinhData.map((tinh) => (
                            <tr key={tinh._id}>
                                <td>{tinh.MaTinh}</td>
                                <td>{tinh.TenTinh}</td>
                                <td>
                                    <button onClick={() => handleEditTinh(tinh)}>Sửa</button>
                                </td>
                                <td>
                                    <button onClick={() => handleDeleteTinh(tinh._id)}>Xóa</button>
                                </td>
                                <td>
                                    <button onClick={() => setSelectedTinh(tinh.MaTinh)}>
                                        Xem Trường THPT
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Hiển thị bảng trường THPT khi tỉnh đã được chọn */}
            {selectedTinh && selectedTinhName && (
                <div>
                    <h3>Danh sách Trường THPT tại {selectedTinhName}</h3>
                    <button onClick={() => setSelectedTinh(null)}>Quay lại</button>

                    {truongData.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Tên Trường</th>
                                    <th>Sửa</th>
                                    <th>Xóa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {truongData.map((truong, index) => (
                                    <tr key={truong._id}>
                                        <td>{index + 1}</td>
                                        <td>{truong.TenTruong}</td>
                                        <td>
                                            <button onClick={() => handleEditTruong(truong)}>Sửa</button>
                                        </td>
                                        <td>
                                            <button onClick={() => handleDeleteTruong(truong._id)}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Không có trường THPT nào cho tỉnh này.</p>
                    )}
                </div>
            )}

            {/* Form sửa Tỉnh */}
            {editingTinh && (
                <div>
                    <h3>Sửa Tỉnh</h3>
                    <input
                        type="text"
                        value={editingTinh.TenTinh}
                        onChange={(e) => setEditingTinh({ ...editingTinh, TenTinh: e.target.value })}
                    />
                    <button onClick={() => handleSaveTinh(editingTinh)}>Lưu</button>
                    <button onClick={() => setEditingTinh(null)}>Hủy</button>
                </div>
            )}

            {/* Form sửa Trường */}
            {editingTruong && (
                <div>
                    <h3>Sửa Trường</h3>
                    <input
                        type="text"
                        value={editingTruong.TenTruong}
                        onChange={(e) => setEditingTruong({ ...editingTruong, TenTruong: e.target.value })}
                    />
                    <button onClick={() => handleSaveTruong(editingTruong)}>Lưu</button>
                    <button onClick={() => setEditingTruong(null)}>Hủy</button>
                </div>
            )}
        </div>
    );
};

export default TinhTp;
