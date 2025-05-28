import useApi from "@/hooks/useApi";
import { useEffect } from "react";

interface DotXetTuyen {
  _key: string;
  HienKetQua: string;
  KichHoat: string;
  MaDotXetTuyen: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TenDot: string;
}
const DotXetTuyen = () => {
  const { data: dataDotXetTuyen, callApi: callApiDotXetTuyen } = useApi<
    DotXetTuyen[]
  >("GET", "/dot-xet-tuyen");

  useEffect(() => {
    callApiDotXetTuyen();
  }, []);
  return (
    <div className="relative h-full">
      <h2 className="font-bold">Đợt xét tuyển</h2>
      <div className="overflow-auto max-w-full max-h-[80vh]">
        <table className="w-full">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Đợt</th>
              <th>Hiện kết quả</th>
              <th>Kích Hoạt</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {dataDotXetTuyen?.map((dotXet, id) => {
              return (
                <tr key={`dot-${id}`}>
                  <td>{dotXet._key}</td>
                  <td>{dotXet.TenDot}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={dotXet.HienKetQua === "1" ? true : false}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={dotXet.KichHoat === "1" ? true : false}
                    />
                  </td>
                  <td>{dotXet.NgayBatDau}</td>
                  <td>{dotXet.NgayKetThuc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DotXetTuyen;
