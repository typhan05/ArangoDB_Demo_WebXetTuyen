import React, { useState, useEffect } from "react";

interface MonHoc {
    id: string;
    tenMon: string;
}

interface KhoiXetTuyen {
    maKhoi: string;
    cacMonHoc: MonHoc[];
}

const KhoiXetTuyenMonHoc = () => {
    const [data, setData] = useState<KhoiXetTuyen[]>([]);
    const [showDetails, setShowDetails] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const toggleRow = (maKhoi: string) => {
        setShowDetails(showDetails === maKhoi ? null : maKhoi);
    };

    const goBack = () => {
        setShowDetails(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/danh-sach-mon-hoc");
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Nếu xóa hết searchTerm, reset chi tiết
        if (value === "") {
            setShowDetails(null);
        }
    };

    let displayedData = data;
    if (showDetails) {
        // Nếu đang xem chi tiết, chỉ hiển thị khối đó
        displayedData = data.filter(item => item.maKhoi === showDetails);
    } else if (searchTerm) {
        // Nếu đang tìm kiếm, lọc theo searchTerm
        displayedData = data.filter(item =>
            item.maKhoi.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return (
        <div>
            <h2>Danh Sách Môn Học</h2>

            <input
                type="text"
                placeholder="Tìm kiếm theo mã khối..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={showDetails !== null}  // <-- disable nếu đang xem chi tiết
                style={{
                    marginBottom: "10px",
                    padding: "5px",
                    width: "100%",
                    backgroundColor: showDetails ? "#eee" : "white"
                }}
            />

            {showDetails && (
                <button onClick={goBack} style={{ marginBottom: "10px" }}>
                    Quay lại
                </button>
            )}

            <table style={{ width: "100%", textAlign: "center", border: "1px solid #ccc" }}>
                <thead>
                    <tr>
                        <th>Mã Khối</th>
                        <th>Môn Học</th>
                        <th>Chi Tiết Môn Học</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedData.map((item, index) => (
                        <React.Fragment key={index}>
                            {showDetails === item.maKhoi ? (
                                item.cacMonHoc.map((monHoc, idx) => (
                                    <tr key={idx}>
                                        <td>{item.maKhoi}</td>
                                        <td>{monHoc.tenMon}</td>
                                        <td>
                                            <button>Sửa</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td>{item.maKhoi}</td>
                                    <td>
                                        {item.cacMonHoc.map((monHoc, idx) => (
                                            <div key={idx}>{monHoc.tenMon}</div>
                                        ))}
                                    </td>
                                    <td>
                                        <button onClick={() => toggleRow(item.maKhoi)}>
                                            Xem Chi Tiết
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default KhoiXetTuyenMonHoc;
