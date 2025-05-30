import React, { useState } from "react";

type ChuyenNganh = {
    MaChuyenNganh: number;
    TenChuyenNganh: string;
};

const ChuyenNganhDetail: React.FC<{
    maNganh: number;
    chuyenNganhData: Record<number, ChuyenNganh[]>;
    onBack: () => void;
}> = ({ maNganh, chuyenNganhData, onBack }) => {
    // State cho form cập nhật
    const [maChuyenNganh, setMaChuyenNganh] = useState("");
    const [tenChuyenNganh, setTenChuyenNganh] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!maChuyenNganh || !tenChuyenNganh) {
            setMessage("Vui lòng nhập đầy đủ mã chuyên ngành và tên chuyên ngành mới");
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/cap-nhat-chuyen-nganh/${maChuyenNganh}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ TenChuyenNganh: tenChuyenNganh }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setMessage(`Lỗi: ${errorData.detail || "Cập nhật thất bại"}`);
                return;
            }

            const data = await response.json();
            setMessage(data.message || "Cập nhật thành công!");
        } catch (error) {
            setMessage("Lỗi khi gọi API: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    return (
        <div>
            <button onClick={onBack} style={{ marginBottom: "10px" }}>
                🔙 Quay lại danh sách ngành
            </button>
            <h4>Chuyên ngành của ngành {maNganh}</h4>

            {chuyenNganhData[maNganh]?.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên chuyên ngành</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chuyenNganhData[maNganh].map((chuyen, index) => (
                            <tr key={chuyen.MaChuyenNganh}>
                                <td>{index + 1}</td>
                                <td>{chuyen.TenChuyenNganh}</td>
                                <td>
                                    <button
                                        className="text-red-500"
                                        onClick={() => {
                                            // Khi nhấn sửa, điền dữ liệu chuyên ngành vào form
                                            setMaChuyenNganh(chuyen.MaChuyenNganh.toString());
                                            setTenChuyenNganh(chuyen.TenChuyenNganh);
                                            setMessage("");
                                        }}
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button className="text-red-500">🗑 Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>⏳ Đang tải chuyên ngành hoặc không có dữ liệu...</p>
            )}

            <h3 className="font-bold text-lg mb-3">➕ Thêm / Cập nhật Chuyên Ngành</h3>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Mã chuyên ngành:
                        <input
                            type="number"
                            value={maChuyenNganh}
                            onChange={(e) => setMaChuyenNganh(e.target.value)}
                            required

                        />
                    </label>
                </div>
                <div>
                    <label>
                        Tên chuyên ngành mới:
                        <input
                            type="text"
                            value={tenChuyenNganh}
                            onChange={(e) => setTenChuyenNganh(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <button type="submit">Cập nhật</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default ChuyenNganhDetail;
