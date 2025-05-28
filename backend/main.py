from datetime import datetime
from fastapi import FastAPI, File, Query, UploadFile
from arango import ArangoClient
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from schema import ResponseSchema, FormXetTuyenRequest
from file_uploader import FileUploader

# Khởi tạo FastAPI
app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Kết nối đến ArangoDB
client = ArangoClient(hosts="http://localhost:8529")

# Xác thực và chọn database
db = client.db("XetTuyenDaiHoc", username="root", password="root")

@app.get("/")
def read_root():
    return {"message": "API FastAPI kết nối ArangoDB"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        result = await FileUploader.upload_file(file)
        return ResponseSchema(detail="Successfully uploaded!", result={"url": result})
    except Exception as e:
            print(e)
            return ResponseSchema(detail=str(e))
    
@app.get("/form-xet-tuyen")
def get_form_xet_tuyen():
    try:
        cursor = db.collection("FormXetTuyen").all()
        result = [doc for doc in cursor]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.get("/tinh-tp")
def get_form_xet_tuyen():
    try:
        cursor = db.collection("Tinh").all()
        result = [doc for doc in cursor]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.get("/truong-thpt")
def get_truong_thpt(ma_tinh: str = Query(..., description="Mã tỉnh")):
    try:
        # Query collection TruongTHPT với điều kiện MaTinh = ma_tinh
        cursor = db.collection("TruongTHPT").find({"MaTinh": ma_tinh})
        
        result = [doc for doc in cursor]
        
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.get("/nganh-hoc-chuyen-nghanh")
def get_nganh_hoc():
    try:
        aql = """
        FOR nganh IN NganhHoc
            LET chuyen_nganh = (
                FOR cn IN ChuyenNganh_NganhHoc
                    FILTER cn._to == nganh._id
                    FOR chuyen IN ChuyenNganh
                        FILTER chuyen._id == cn._from
                        RETURN {
                            TenChuyenNganh: chuyen.TenChuyenNganh,
                            _id: chuyen._id
                        }
            )
            RETURN {
                MaNganhHoc: nganh.MaNganhHoc,
                DiemDau: nganh.DiemDau,
                TenNganhHoc: nganh.TenNganhHoc,
                idNganh: nganh._id,
                TrangThai: nganh.TrangThai,
                ChuyenNganh: chuyen_nganh
            }
        """
        cursor = db.aql.execute(aql)
        result = []

        for item in cursor:
            if item["ChuyenNganh"]:
                for cn in item["ChuyenNganh"]:
                    result.append({
                        "MaNganhHoc": item["MaNganhHoc"],
                        "DiemDau": item["DiemDau"],
                        "TenNganhHoc": f"{item['TenNganhHoc']} ({cn['TenChuyenNganh']})",
                        "_id": cn["_id"],
                        "idNganh": item["idNganh"],
                        "TrangThai": item["TrangThai"]
                    })
            else:
                result.append({
                    "MaNganhHoc": item["MaNganhHoc"],
                    "DiemDau": item["DiemDau"],
                    "TenNganhHoc": item["TenNganhHoc"],
                    "_id": item["idNganh"],
                    "idNganh": item["idNganh"],
                    "TrangThai": item["TrangThai"]
                })

        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.get("/khoi-xet-tuyen")
def get_khoi_xet_tuyen_by_ma_nganh(
    ma_nganh: str = Query(..., description="Mã ngành học, ví dụ: NganhHoc/251975")
):
    try:
        aql = """
        FOR edge IN KhoiXetTuyen_NganhHoc
            FILTER edge._from == @ma_nganh
            FOR khoi IN KhoiXetTuyen
                FILTER khoi._id == edge._to
                RETURN khoi
        """

        bind_vars = {
            "ma_nganh": ma_nganh
        }

        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        result = list(cursor)

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.get("/mon-hoc-theo-khoi")
def get_mon_hoc_by_ma_khoi(ma_khoi: str = Query(..., description="Mã khối xét tuyển, ví dụ: A00")):
    try:
        aql = """
        LET khoi = FIRST(
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @ma_khoi
                RETURN k
        )

        FOR edge IN KhoiXetTuyen_MonHoc
            FILTER edge._from == khoi._id
            FOR mon IN MonHoc
                FILTER mon._id == edge._to
                RETURN mon
        """

        bind_vars = {
            "ma_khoi": ma_khoi
        }

        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        result = [doc for doc in cursor]
        
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
def generate_ma_form(dob_str: str, db) -> str:
    # Đảm bảo chuỗi ISO được chuẩn hóa và không chứa "Z"
    dob_str_clean = dob_str.split("T")[0]
    dob_date = datetime.fromisoformat(dob_str_clean)

    dob_part = dob_date.strftime("%Y%m%d")

    # Truy vấn AQL để đếm số form đã đăng ký với ngày sinh đó
    count_aql = """
    RETURN LENGTH(
        FOR f IN FormXetTuyen
            FILTER f.NgaySinh == @NgaySinh
            RETURN 1
    )
    """
    bind_vars = {"NgaySinh": dob_date.strftime("%Y-%m-%d")}

    count_cursor = db.aql.execute(count_aql, bind_vars=bind_vars, count=True)
    current_count = list(count_cursor)[0] if count_cursor else 0
    next_number = current_count + 1

    return f"{dob_part}{next_number:02}"  # Luôn giữ 2 chữ số đếm phía sau
    
@app.post("/create-form-xet-tuyen")
def create_form(payload: FormXetTuyenRequest):
    try:
        ma_form = generate_ma_form(payload.dob, db)

        dob = datetime.fromisoformat(payload.dob[:10]).strftime("%Y-%m-%d")
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        aql = """
        LET newForm = {
          MaForm: @MaForm,
          HoTen: @HoTen,
          GioiTinh: @GioiTinh,
          NgaySinh: @NgaySinh,
          CCCD: @CCCD,
          Email: @Email,
          SoDienThoai: @SoDienThoai,
          DiaChi: @DiaChi,
          NamTotNghiep: @NamTotNghiep,
          CoNguyenVongDuHoc: @CoNguyenVongDuHoc,
          NgayDangKy: @NgayDangKy,
          MaTruong: @MaTruong,
          DiemThi: @DiemThi,
          FileHocBa: @FileHocBa
        }

        INSERT newForm INTO FormXetTuyen
        LET inserted = NEW

        // Liên kết đợt xét tuyển
        LET dot = FIRST(FOR d IN DotXetTuyen FILTER d.MaDotXetTuyen == @MaDotXetTuyen RETURN d)
        INSERT { _from: inserted._id, _to: dot._id } INTO FormXetTuyen_DotXetTuyen

        // Liên kết hình thức xét tuyển
        LET hinhthuc = FIRST(FOR h IN HinhThucXetTuyen FILTER h.MaHinhThucXetTuyen == @MaHinhThucXetTuyen RETURN h)
        INSERT { _from: inserted._id, _to: hinhthuc._id } INTO FormXetTuyen_HinhThucXetTuyen

        // Phân biệt: chuyên ngành hay ngành học
        LET isChuyenNganh = LIKE(@NganhHocId, "ChuyenNganh/%")
        LET isNganhHoc = LIKE(@NganhHocId, "NganhHoc/%")

        LET temp1 = (
            FOR i IN 1..1
                FILTER isChuyenNganh
                INSERT { _from: inserted._id, _to: @NganhHocId } INTO FormXetTuyen_ChuyenNganh
                RETURN 1
        )
        
        LET temp2 = (
            FOR i IN 1..1
                FILTER isNganhHoc
                INSERT { _from: inserted._id, _to: @NganhHocId } INTO FormXetTuyen_NganhHoc
                RETURN 1
        )

        // Khối xét tuyển
        INSERT { _from: inserted._id, _to: @KhoiId } INTO FormXetTuyen_KhoiXetTuyen

        RETURN inserted
        """

        bind_vars = {
            "MaForm": ma_form,
            "HoTen": payload.fullName,
            "GioiTinh": "1" if payload.gender.lower() == "male" else "0",
            "NgaySinh": dob,
            "CCCD": payload.cccd,
            "Email": payload.email,
            "SoDienThoai": payload.phone,
            "DiaChi": payload.address,
            "NamTotNghiep": payload.namTotNghiep,
            "CoNguyenVongDuHoc": "1" if payload.duHoc else "0",
            "NgayDangKy": now,
            "MaTruong": payload.truong,
            "DiemThi": payload.diem,
            "MaDotXetTuyen": payload.maDotXetTuyen,
            "MaHinhThucXetTuyen": payload.maHinhThucXetTuyen,
            "NganhHocId": payload.nganhHocId,
            "KhoiId": f"KhoiXetTuyen/{payload.khoi}",
            "FileHocBa": payload.fileUrl
        }

        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        inserted = list(cursor)[0]
        return JSONResponse(content=inserted)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Chạy server FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
