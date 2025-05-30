from datetime import datetime
from fastapi import FastAPI, File, Query, UploadFile, Body,HTTPException
from arango import ArangoClient
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from file_uploader import FileUploader
from unidecode import unidecode
from schema import KhoiChange,AddKhoiXetTuyenPayload,ResponseSchema,ChuyenNganhUpdate,FormXetTuyenRequest, NganhHocRequest, CreateChuyenNganhRequest ,DeleteKhoiXetTuyen,DeleteMonHoc,UpdateTenMonHocByNameRequest,KhoiInput,MonHocInput,FormXetTuyenRequest, KhoiUpdateByMa 
import logging

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


#------------------------------#
#       USERS API              #
#------------------------------#
@app.post("/nganhhoc/them-khoixettuyen")
async def them_khoi_xet_tuyen_cho_nganh(data: AddKhoiXetTuyenPayload):
    ma_nganh = data.ma_nganh
    ma_khoi = data.ma_khoi

    # Kiểm tra xem edge đã tồn tại chưa (để tránh duplicate)
    check = list(db.aql.execute(
        """
        FOR edge IN NganhHoc_KhoiXetTuyen
          FILTER edge._from == CONCAT("KhoiXetTuyen/", @maKhoi)
            AND edge._to == CONCAT("NganhHoc/", @maNganh) 
          RETURN edge
        """,
        bind_vars={"maNganh": ma_nganh, "maKhoi": ma_khoi}
    ))

    if check:
        raise HTTPException(status_code=400, detail="Khối xét tuyển này đã tồn tại trong ngành")

    # Thêm edge mới
    db.aql.execute(
        """
        INSERT {
            _from: CONCAT("KhoiXetTuyen/", @maKhoi),
            _to: CONCAT("NganhHoc/", @maNganh)
        } INTO KhoiXetTuyen_NganhHoc
        """,
        bind_vars={"maNganh": ma_nganh, "maKhoi": ma_khoi}
    )

    return {"message": f"Đã thêm khối xét tuyển {ma_khoi} cho ngành {ma_nganh}"}
@app.delete("/khoixettuyen/delete")
async def delete_khoi_xet_tuyen(data: DeleteKhoiXetTuyen):
    MaKhoi = data.MaKhoi

    result = db.aql.execute(
        """
        FOR k IN KhoiXetTuyen
          FILTER k.MaKhoi == @maKhoi
          REMOVE k IN KhoiXetTuyen
        """,
        bind_vars={"maKhoi": MaKhoi}
    )

    # Kiểm tra số lượng bị xóa (nếu cần)
    count = len(list(result))  # thường là 0 vì REMOVE không trả lại gì

    return {"message": f"Đã xóa các KhoiXetTuyen với MaKhoi = {MaKhoi}"}

@app.delete("/monhoc/delete")
def delete_monhoc(request: DeleteMonHoc):
    try:
        # Bước 1: Tìm document MonHoc theo tenMonHoc
        aql_find_monhoc = """
        FOR mh IN MonHoc
            FILTER mh.tenMonHoc == @tenMonHoc
            RETURN mh
        """
        cursor_mh = db.aql.execute(aql_find_monhoc, bind_vars={"tenMonHoc": request.tenMonHoc})
        monhoc_list = list(cursor_mh)
        if not monhoc_list:
            return JSONResponse(status_code=404, content={"error": "Môn học không tồn tại"})

        monhoc = monhoc_list[0]
        monhoc_id = monhoc["_id"]

        # Bước 2: Tìm document KhoiXetTuyen theo maKhoi
        aql_find_khoi = """
        FOR kxt IN KhoiXetTuyen
            FILTER kxt.MaKhoi == @maKhoi
            RETURN kxt
        """
        cursor_khoi = db.aql.execute(aql_find_khoi, bind_vars={"maKhoi": request.maKhoi})
        khoi_list = list(cursor_khoi)
        if not khoi_list:
            return JSONResponse(status_code=404, content={"error": "Khối xét tuyển không tồn tại"})

        khoi = khoi_list[0]
        khoi_id = khoi["_id"]

        # Bước 3: Xóa các edge liên quan giữa KhoiXetTuyen và MonHoc
        edge_collection = "KhoiXetTuyen_MonHoc"
        aql_delete_edges = f"""
        FOR edge IN {edge_collection}
            FILTER (edge._from == @khoi_id AND edge._to == @monhoc_id)
            REMOVE edge IN {edge_collection}
        """
        db.aql.execute(aql_delete_edges, bind_vars={"khoi_id": khoi_id, "monhoc_id": monhoc_id})

        # Bước 4: Xóa document môn học
        aql_delete_monhoc = """
        REMOVE @monhoc_key IN MonHoc
        """
        db.aql.execute(aql_delete_monhoc, bind_vars={"monhoc_key": monhoc["_key"]})

        return JSONResponse(content={"message": f"Đã xóa môn học '{request.tenMonHoc}' thuộc khối '{request.maKhoi}' thành công"})

    except Exception as e:
        logging.error(f"Lỗi khi xóa môn học: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.put("/mon-hoc/update-by-name")
async def update_ten_monhoc_by_name(data: UpdateTenMonHocByNameRequest):
    try:
        # 1. Tìm môn học thuộc khối có maKhoi và tên môn cũ
        cursor = db.aql.execute(
            """
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @maKhoi
                FOR edge IN KhoiXetTuyen_MonHoc
                    FILTER edge._from == k._id
                    FOR m IN MonHoc
                        FILTER m._id == edge._to AND m.tenMonHoc == @tenMonHocCu
                        RETURN m
            """,
            bind_vars={
                "maKhoi": data.maKhoi,
                "tenMonHocCu": data.tenMonHocCu
            }
        )

        monhoc_list = list(cursor)
        if not monhoc_list:
            raise HTTPException(status_code=404, detail="Không tìm thấy môn học cần sửa")

        monhoc = monhoc_list[0]  # Giả sử chỉ có 1 kết quả

        # 2. Cập nhật tên môn học
        cursor_update = db.aql.execute(
            """
            UPDATE { _key: @key } WITH { tenMonHoc: @tenMonHocMoi } IN MonHoc
            RETURN NEW
            """,
            bind_vars={
                "key": monhoc["_key"],
                "tenMonHocMoi": data.tenMonHocMoi
            }
        )

        updated_mon = list(cursor_update)[0]
        return {"message": "Cập nhật tên môn học thành công", "data": updated_mon}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật môn học: {str(e)}")

@app.post("/mon-hoc")
async def add_mon_hoc(data: MonHocInput):
    try:
        cursor = db.aql.execute("""
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @maKhoi
                RETURN k
        """, bind_vars={"maKhoi": data.maKhoi})
        khoi_list = list(cursor)
        if not khoi_list:
            raise HTTPException(status_code=404, detail="Khối không tồn tại")
        khoi_id = khoi_list[0]["_id"]

        # Tạo mã môn học từ tên môn học
        maMonHoc = unidecode(data.tenMonHoc).lower().replace(" ", "_")

        cursor = db.aql.execute("""
            RETURN DOCUMENT("MonHoc", @maMonHoc)
        """, bind_vars={"maMonHoc": maMonHoc})
        monhoc = list(cursor)[0]

        if not monhoc:
            cursor = db.aql.execute("""
                INSERT {
                    _key: @maMonHoc,
                    tenMonHoc: @tenMonHoc,
                    TrangThai: 1
                } INTO MonHoc
                RETURN NEW
            """, bind_vars={"maMonHoc": maMonHoc, "tenMonHoc": data.tenMonHoc})
            monhoc = list(cursor)[0]

        edge_cursor = db.aql.execute("""
            FOR e IN KhoiXetTuyen_MonHoc
                FILTER e._from == @khoi_id AND e._to == @monhoc_id
                RETURN e
        """, bind_vars={"khoi_id": khoi_id, "monhoc_id": monhoc["_id"]})
        if list(edge_cursor):
            return {"message": "Môn học đã được liên kết với khối này", "data": monhoc}

        db.aql.execute("""
            INSERT {
                _from: @khoi_id,
                _to: @monhoc_id
            } INTO KhoiXetTuyen_MonHoc
        """, bind_vars={"khoi_id": khoi_id, "monhoc_id": monhoc["_id"]})

        return {"message": "Liên kết môn học với khối thành công", "data": monhoc}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm môn học: {str(e)}")

@app.post("/khoi-xet-tuyen")
async def create_khoi(khoi: KhoiInput):
    try:
        # Kiểm tra tồn tại
        cursor = db.aql.execute("""
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @maKhoi
                RETURN k
        """, bind_vars={"maKhoi": khoi.maKhoi})
        
        if len(list(cursor)) > 0:
            raise HTTPException(status_code=400, detail="Khối đã tồn tại.")

        # Thêm khối mới bằng AQL
        cursor = db.aql.execute("""
            INSERT {
                MaKhoi: @maKhoi,
                TrangThai: 1
            } INTO KhoiXetTuyen
            RETURN NEW
        """, bind_vars={"maKhoi": khoi.maKhoi})

        result = list(cursor)[0]
        return {"message": "Thêm khối thành công", "data": result}

    except DocumentInsertError as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm khối (AQL): {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {str(e)}")
@app.put("/khoi-xet-tuyen/update-by-ma")
async def update_khoi_by_ma(data: KhoiUpdateByMa):
    try:
        # Kiểm tra mã khối mới đã tồn tại chưa
        cursor = db.aql.execute("""
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @maKhoiMoi
                RETURN k
        """, bind_vars={"maKhoiMoi": data.maKhoiMoi})
        if len(list(cursor)) > 0:
            raise HTTPException(status_code=400, detail="Mã khối mới đã tồn tại.")

        # Cập nhật khối theo mã cũ
        cursor = db.aql.execute("""
            FOR k IN KhoiXetTuyen
                FILTER k.MaKhoi == @maKhoiCu
                UPDATE k WITH { MaKhoi: @maKhoiMoi } IN KhoiXetTuyen
                RETURN NEW
        """, bind_vars={"maKhoiCu": data.maKhoiCu, "maKhoiMoi": data.maKhoiMoi})

        result_list = list(cursor)
        if not result_list:
            raise HTTPException(status_code=404, detail="Không tìm thấy khối với mã cũ này.")

        return {"message": "Cập nhật mã khối thành công", "data": result_list[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật khối: {str(e)}")
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
    
@app.get("/nganh-hoc")
def get_nganh_hoc():
    try:
        cursor = db.collection("NganhHoc").all()
        result = [doc for doc in cursor]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/nganh-hoc-chuyen-nghanh")
def get_nganh_hoc_chuyen_nghanh():
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


#------------------------------#
#       ADMIN API              #
#------------------------------#

@app.get("/dot-xet-tuyen")
def get_dot_xet_tuyen():
    try:
        query = "FOR d IN DotXetTuyen FILTER d.KichHoat == '1' RETURN d"
        cursor = db.aql.execute(query)
        result = [doc for doc in cursor]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/danh-sach-mon-hoc")
def get_danh_sach_mon_hoc():
    try:
        aql = """
        FOR khoi IN KhoiXetTuyen
            LET dsMonHoc = (
                FOR edge IN KhoiXetTuyen_MonHoc
                    FILTER edge._from == khoi._id
                    FILTER PARSE_IDENTIFIER(edge._to).collection == "MonHoc"  // Đảm bảo _to là MonHoc
                    LET mon = DOCUMENT(edge._to)
                    RETURN {
                        id: mon._id,
                        tenMon: mon.tenMonHoc  // Dùng đúng tên trường
                    }
            )
            RETURN {
                maKhoi: khoi.MaKhoi,
                cacMonHoc: dsMonHoc
            }
        """
        cursor = db.aql.execute(aql)
        result = [doc for doc in cursor]
        
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/mon-hoc-theo-nganh")
def get_mon_hoc_by_nganh(ma_nganh: int = Query(..., description="Mã ngành học, ví dụ: 7140201")):
    try:
        
        aql = """
        LET nganh = FIRST(
            FOR n IN NganhHoc
                FILTER n.MaNganhHoc == @ma_nganh
                RETURN n
        )

        LET khoiEdges = (
            FOR edge IN KhoiXetTuyen_NganhHoc
                FILTER edge._from == nganh._id
                RETURN edge._to
        )

        LET khois = (
            FOR k IN KhoiXetTuyen
                FILTER k._id IN khoiEdges
                RETURN {
                    MaKhoi: k.MaKhoi,
                    MonHocs: (
                        FOR monEdge IN KhoiXetTuyen_MonHoc
                            FILTER monEdge._from == k._id
                            FOR mon IN MonHoc
                                FILTER mon._id == monEdge._to
                                RETURN {
                                    _id: mon._id,
                                    TenMonHoc: mon.tenMonHoc
                                }
                    )
                }
        )

        RETURN {
            MaNganhHoc: nganh.MaNganhHoc,
            TenNganhHoc: nganh.TenNganhHoc,
            KhoiXetTuyen: khois
        }
        """

        bind_vars = {
            "ma_nganh": ma_nganh
        }

        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        result = [doc for doc in cursor]

        # Check if no results are found
        if not result:
            return JSONResponse(status_code=404, content={"message": "Không tìm thấy thông tin cho mã ngành này."})

        return JSONResponse(content=result)
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/chuyen-nganh-theo-nganh")
def get_chuyen_nganh_by_nganh(ma_nganh: int = Query(..., description="Mã ngành học, ví dụ: 251976")):
    try:
        aql = """
        LET nganh = FIRST(
            FOR nh IN NganhHoc
                FILTER nh.MaNganhHoc == @ma_nganh
                RETURN nh
        )

        FOR edge IN ChuyenNganh_NganhHoc
            FILTER edge._to == nganh._id
            LET chuyenNganh = DOCUMENT(edge._from)
            RETURN {
                MaChuyenNganh: chuyenNganh.MaChuyenNganh,
                TenChuyenNganh: chuyenNganh.TenChuyenNganh
            }
        """

        bind_vars = {"ma_nganh": ma_nganh}
        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        result = [doc for doc in cursor]

        if not result:
            return JSONResponse(status_code=404, content={"message": "Không tìm thấy chuyên ngành cho mã ngành này."})

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#update nghành học
@app.put("/nganh-hoc/{ma_nganh}")
def update_nganh_hoc(ma_nganh: int, payload: NganhHocRequest):
    try:
        # Kiểm tra xem ngành học có tồn tại không
        nganh = db.collection("NganhHoc").get(ma_nganh)
        if not nganh:
            return JSONResponse(status_code=404, content={"error": "Ngành học không tồn tại"})

        # Cập nhật thông tin ngành học
        updated_data = {"TenNganhHoc": "Tên ngành học mới"}  # Thêm thông tin cập nhật
        db.collection("NganhHoc").update(nganh["_id"], updated_data)

        return JSONResponse(content={"message": "Ngành học đã được cập nhật thành công", "data": updated_data})
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#delete nghành học
@app.delete("/nganh-hoc/{ma_nganh}")
def delete_nganh_hoc(ma_nganh: int):
    try:
        # Bước 1: Tìm ngành học theo mã
        aql_find = """
        FOR nganh IN NganhHoc
            FILTER nganh.MaNganhHoc == @ma_nganh
            RETURN nganh
        """
        bind_vars = {"ma_nganh": ma_nganh}
        cursor = db.aql.execute(aql_find, bind_vars=bind_vars)
        nganh_list = list(cursor)

        if not nganh_list:
            return JSONResponse(status_code=404, content={"error": "Ngành học không tồn tại"})

        nganh = nganh_list[0]
        nganh_id = nganh["_id"]

        # Bước 2: Xóa tất cả edge liên quan
        edge_collections = ["KhoiXetTuyen_NganhHoc", "ChuyenNganh_NganhHoc"]
        for edge_collection in edge_collections:
            aql_delete_edges_from = f"""
            FOR edge IN {edge_collection}
                FILTER edge._from == @nganh_id OR edge._to == @nganh_id
                REMOVE edge IN {edge_collection}
            """
            db.aql.execute(aql_delete_edges_from, bind_vars={"nganh_id": nganh_id})

        # Bước 3: Xóa ngành học
        aql_delete_nganh = """
        REMOVE @nganh_key IN NganhHoc
        """
        db.aql.execute(aql_delete_nganh, bind_vars={"nganh_key": nganh["_key"]})

        return JSONResponse(content={"message": f"Ngành học mã {ma_nganh} đã được xóa thành công"})

    except Exception as e:
        logging.error(f"Lỗi khi xóa ngành học {ma_nganh}: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

#create nghành học
@app.post("/api/nganh-hoc")
def create_nganh_hoc(payload: NganhHocRequest):
    try:
        # Kiểm tra xem ngành học đã tồn tại chưa bằng AQL
        aql_find = """
        FOR nganh IN NganhHoc
            FILTER nganh.MaNganhHoc == @ma_nganh
            RETURN nganh
        """
        bind_vars_find = {"ma_nganh": payload.MaNganhHoc}
        cursor_find = db.aql.execute(aql_find, bind_vars=bind_vars_find)
        existing_nganh = list(cursor_find)

        if existing_nganh:
            return JSONResponse(status_code=400, content={"error": "Ngành học này đã tồn tại"})

        # Thêm ngành học mới vào cơ sở dữ liệu sử dụng AQL
        aql_insert = """
        INSERT {
            DiemDau: @diem_dau,
            MaBacHoc: @ma_bac_hoc,
            MaNganhHoc: @ma_nganh_hoc,
            TenNganhHoc: @ten_nganh_hoc,
            TrangThai: 1  // Mặc định trạng thái là 1 (hoạt động)
        } INTO NganhHoc
        RETURN NEW
        """

        bind_vars_insert = {
            "diem_dau": payload.DiemDau,
            "ma_bac_hoc": payload.MaBacHoc,
            "ma_nganh_hoc": payload.MaNganhHoc,
            "ten_nganh_hoc": payload.TenNganhHoc,
        }

        cursor_insert = db.aql.execute(aql_insert, bind_vars=bind_vars_insert)
        inserted_nganh = list(cursor_insert)

        if not inserted_nganh:
            raise Exception("Không thể thêm ngành học vào cơ sở dữ liệu")

        return JSONResponse(content={"message": "Ngành học đã được thêm thành công", "data": inserted_nganh[0]})
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#create chuyên nghành theo nghành học
@app.post("/api/nganh-hoc/{ma_nganh_hoc}/create-chuyen-nganh")
def create_chuyen_nganh_for_nganh(ma_nganh_hoc: str, payload: CreateChuyenNganhRequest):
    try:
        aql = """
        LET existing = (
          FOR c IN ChuyenNganh
            FILTER c.MaChuyenNganh == @ma_chuyen_nganh
            RETURN c
        )
        FILTER LENGTH(existing) == 0

        LET nganhHoc = FIRST(
          FOR n IN NganhHoc
            FILTER n.MaNganhHoc == @ma_nganh_hoc
            RETURN n
        )
        FILTER nganhHoc != NULL

        LET newChuyenNganh = (
          INSERT {
            MaChuyenNganh: @ma_chuyen_nganh,
            TenChuyenNganh: @ten_chuyen_nganh
          } INTO ChuyenNganh
          RETURN NEW
        )[0]

        INSERT {
          _from: newChuyenNganh._id,
          _to: nganhHoc._id
        } INTO ChuyenNganh_NganhHoc

        RETURN {
          chuyen_nganh: newChuyenNganh,
          edge: {
            _from: newChuyenNganh._id,
            _to: nganhHoc._id
          }
        }
        """

        bind_vars = {
            "ma_chuyen_nganh": payload.MaChuyenNganh,
            "ten_chuyen_nganh": payload.TenChuyenNganh,
            "ma_nganh_hoc": ma_nganh_hoc
        }

        cursor = db.aql.execute(aql, bind_vars=bind_vars)
        result = list(cursor)

        if not result:
            return JSONResponse(status_code=400, content={"error": "Chuyên ngành đã tồn tại hoặc ngành học không hợp lệ"})

        return JSONResponse(content={
            "message": "Tạo chuyên ngành từ ngành học thành công",
            "data": result[0]
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#update nghành học
@app.put("/api/update-nganh-hoc")
def update_nganh_hoc(payload: NganhHocRequest):
    print("== PAYLOAD RECEIVED ==", payload.dict())
    try:
        # Kiểm tra xem ngành học có tồn tại không
        aql_find = """
        FOR nganh IN NganhHoc
            FILTER nganh.MaNganhHoc == @ma_nganh
            RETURN nganh
        """
        bind_vars_find = {"ma_nganh": payload.MaNganhHoc}
        cursor_find = db.aql.execute(aql_find, bind_vars=bind_vars_find)
        existing_nganh = list(cursor_find)

        if not existing_nganh:
            return JSONResponse(status_code=404, content={"error": "Ngành học không tồn tại"})

        # Thực hiện cập nhật trực tiếp theo MaNganhHoc
        aql_update = """
        FOR doc IN NganhHoc
          FILTER doc.MaNganhHoc == @ma_nganh
          UPDATE doc WITH {
            DiemDau: @diem_dau,
            MaBacHoc: @ma_bac_hoc,
            TenNganhHoc: @ten_nganh_hoc,
            
          } IN NganhHoc
          RETURN NEW
        """

        bind_vars_update = {
            "ma_nganh": payload.MaNganhHoc,
            "diem_dau": payload.DiemDau,
            "ma_bac_hoc": payload.MaBacHoc,
            "ten_nganh_hoc": payload.TenNganhHoc,
            
        }

        cursor_update = db.aql.execute(aql_update, bind_vars=bind_vars_update)
        updated_nganh = list(cursor_update)

        if not updated_nganh:
            raise Exception("Không thể cập nhật ngành học")

        return JSONResponse(content={"message": "Ngành học đã được cập nhật thành công", "data": updated_nganh[0]})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

#get danh sách sinh viên đăng ký xét tuyển
@app.get("/admin/list-form-xet-tuyen")
def list_forms_with_result():
    try:
        aql = """
        FOR form IN FormXetTuyen
          LET nganh = FIRST(
            FOR v IN 1..1 OUTBOUND form._id FormXetTuyen_NganhHoc
              RETURN v
          )

          LET hinhthuc = FIRST(
            FOR v IN 1..1 OUTBOUND form._id FormXetTuyen_HinhThucXetTuyen
              RETURN v
          )

          LET truong = FIRST(
            FOR v IN 1..1 OUTBOUND form._id FormXetTuyen_TruongTHPT
              RETURN v
          )

          LET edge = FIRST(
        FOR e IN NganhHoc_HinhThucXetTuyen
    FILTER e._from == nganh._id AND e._to == hinhthuc._id
    RETURN e
)

LET diemChuan = edge.DiemTrungTuyen
LET ketQua = form.DiemThi >= diemChuan ? "Đậu" : "Rớt"


          RETURN {
            MaForm: form.MaForm,
            HoTen: form.HoTen,
            NgaySinh: form.NgaySinh,
            CCCD: form.CCCD,
            Email: form.Email,
            DiaChi: form.DiaChi,
            NamTotNghiep: form.NamTotNghiep,
            SoDienThoai: form.SoDienThoai,
            TenNganhHoc: nganh.TenNganhHoc,
            TenHinhThuc: hinhthuc.TenHinhThucXetTuyen,
            TenTruong: truong.TenTruong,
            DiemThi: form.DiemThi,
            NgayDangKy: form.NgayDangKy,
            KetQua: ketQua
          }
        """
        cursor = db.aql.execute(aql)
        forms = list(cursor)
        return JSONResponse(content=forms)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/xoa-khoi-nganh/{ma_nganh}/{ma_khoi}")
async def xoa_khoi_nganh(ma_nganh: int, ma_khoi: str):
    try:
        # 1. Lấy _id ngành học từ MaNganhHoc
        aql_get_nganh_id = """
        FOR n IN NganhHoc
          FILTER n.MaNganhHoc == @ma_nganh
          LIMIT 1
          RETURN n._id
        """
        list_nganh_id = list(db.aql.execute(aql_get_nganh_id, bind_vars={"ma_nganh": ma_nganh}))
        if not list_nganh_id:
            raise HTTPException(status_code=404, detail="Không tìm thấy ngành học với mã này")
        nganh_id = list_nganh_id[0]

        # 2. Lấy _id khối xét tuyển từ MaKhoi
        aql_get_khoi_id = """
        FOR k IN KhoiXetTuyen
          FILTER k.MaKhoi == @ma_khoi
          LIMIT 1
          RETURN k._id
        """
        list_khoi_id = list(db.aql.execute(aql_get_khoi_id, bind_vars={"ma_khoi": ma_khoi}))
        if not list_khoi_id:
            raise HTTPException(status_code=404, detail="Không tìm thấy khối xét tuyển với mã này")
        khoi_id = list_khoi_id[0]

        # 3. Tìm edge nối ngành - khối
        aql_find_edge = """
        FOR e IN KhoiXetTuyen_NganhHoc
          FILTER e._from == @nganh_id AND e._to == @khoi_id
          RETURN e._key
        """
        edge_keys = list(db.aql.execute(aql_find_edge, bind_vars={"nganh_id": nganh_id, "khoi_id": khoi_id}))
        if not edge_keys:
            raise HTTPException(status_code=404, detail="Không tìm thấy liên kết ngành với khối")

        # 4. Xóa các edge tìm được
        aql_delete_edge = """
        FOR key IN @keys
          REMOVE { _key: key } IN KhoiXetTuyen_NganhHoc
        """
        db.aql.execute(aql_delete_edge, bind_vars={"keys": edge_keys})

        return {"message": f"Đã xóa khối {ma_khoi} khỏi ngành {ma_nganh}"}

    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
    
@app.put("/cap-nhat-khoi-nganh/{ma_nganh}/{ma_khoi_cu}")
async def cap_nhat_khoi_nganh(ma_nganh: int, ma_khoi_cu: str, data: KhoiChange):
    try:
        # 1. Lấy _id ngành học từ MaNganhHoc
        aql_get_nganh_id = """
        FOR n IN NganhHoc
        FILTER n.MaNganhHoc == @ma_nganh
        LIMIT 1
        RETURN n._id
        """
        list_nganh_id = list(db.aql.execute(aql_get_nganh_id, bind_vars={"ma_nganh": ma_nganh}))
        if not list_nganh_id:
            return JSONResponse(status_code=404, content={"detail": "Không tìm thấy ngành học với mã này"})
        nganh_id = list_nganh_id[0]

        # 2. Tìm _id khối cũ và khối mới
        aql_find_khoi = """
        LET khoi_cu = FIRST(FOR k IN KhoiXetTuyen FILTER k.MaKhoi == @ma_khoi_cu RETURN k._id)
        LET khoi_moi = FIRST(FOR k IN KhoiXetTuyen FILTER k.MaKhoi == @ma_khoi_moi RETURN k._id)
        RETURN { khoi_cu, khoi_moi }
        """
        bind_vars_find = {"ma_khoi_cu": ma_khoi_cu, "ma_khoi_moi": data.MaKhoiMoi}
        res = list(db.aql.execute(aql_find_khoi, bind_vars=bind_vars_find))[0]
        if not res["khoi_cu"] or not res["khoi_moi"]:
            return JSONResponse(status_code=404, content={"detail": "Khối cũ hoặc khối mới không tồn tại"})

        # 3. Tìm edge nối ngành với khối cũ (dùng nganh_id lấy từ trên)
        aql_find_edge = """
FOR e IN KhoiXetTuyen_NganhHoc
  FILTER e._from == @nganh_id AND e._to == @khoi_cu
  RETURN e
"""
        edges = list(db.aql.execute(aql_find_edge, bind_vars={"khoi_cu": res["khoi_cu"], "nganh_id": nganh_id}))
        if not edges:
            return JSONResponse(status_code=404, content={"detail": "Không tìm thấy liên kết ngành với khối cũ"})

        # 4. Cập nhật edge: đổi _from từ khối cũ sang khối mới
        aql_update_edge = """
FOR e IN KhoiXetTuyen_NganhHoc
  FILTER e._from == @nganh_id AND e._to == @khoi_cu
  UPDATE e WITH { _to: @khoi_moi } IN KhoiXetTuyen_NganhHoc
  RETURN NEW
"""
        updated_edges = list(db.aql.execute(aql_update_edge, bind_vars={"khoi_cu": res["khoi_cu"], "khoi_moi": res["khoi_moi"], "nganh_id": nganh_id}))

        return {"message": f"Đã cập nhật khối ngành từ {ma_khoi_cu} sang {data.MaKhoiMoi} cho ngành {ma_nganh}", "updated_edges": updated_edges}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
@app.post("/them-khoi-nganh/{ma_nganh}")
async def them_khoi_nganh(ma_nganh: int, data: KhoiChange = Body(...)):
    try:
        # 1. Lấy _id ngành học từ MaNganhHoc
        aql_get_nganh_id = """
        FOR n IN NganhHoc
          FILTER n.MaNganhHoc == @ma_nganh
          LIMIT 1
          RETURN n._id
        """
        list_nganh_id = list(db.aql.execute(aql_get_nganh_id, bind_vars={"ma_nganh": ma_nganh}))
        if not list_nganh_id:
            return JSONResponse(status_code=404, content={"detail": "Không tìm thấy ngành học với mã này"})
        nganh_id = list_nganh_id[0]

        # 2. Kiểm tra khối xét tuyển trong KhoiXetTuyen
        aql_find_khoi = """
        FOR k IN KhoiXetTuyen
          FILTER k.MaKhoi == @ma_khoi
          LIMIT 1
          RETURN k
        """
        khoi_list = list(db.aql.execute(aql_find_khoi, bind_vars={"ma_khoi": data.MaKhoiMoi}))

        if not khoi_list:
            # Nếu không tồn tại khối này, thêm mới khối xét tuyển
            aql_insert_khoi = """
            INSERT { MaKhoi: @ma_khoi, TenMon: [] } INTO KhoiXetTuyen
            """
            db.aql.execute(aql_insert_khoi, bind_vars={"ma_khoi": data.MaKhoiMoi})
        
        # Lấy lại _id khối mới (hoặc mới tạo)
        aql_get_khoi_id = """
        FOR k IN KhoiXetTuyen
          FILTER k.MaKhoi == @ma_khoi
          LIMIT 1
          RETURN k._id
        """
        khoi_id = list(db.aql.execute(aql_get_khoi_id, bind_vars={"ma_khoi": data.MaKhoiMoi}))[0]

        # 3. Kiểm tra xem edge nối ngành - khối đã tồn tại chưa
        aql_check_edge = """
        FOR e IN KhoiXetTuyen_NganhHoc
          FILTER e._from == @nganh_id AND e._to == @khoi_id
          LIMIT 1
          RETURN e
        """
        existing_edge = list(db.aql.execute(aql_check_edge, bind_vars={"nganh_id": nganh_id, "khoi_id": khoi_id}))
        if existing_edge:
            return JSONResponse(status_code=400, content={"detail": "Khối này đã tồn tại trong ngành."})

        # 4. Tạo mới edge nối ngành - khối
        aql_create_edge = """
        INSERT { _from: @nganh_id, _to: @khoi_id } INTO KhoiXetTuyen_NganhHoc
        """
        db.aql.execute(aql_create_edge, bind_vars={"nganh_id": nganh_id, "khoi_id": khoi_id})

        return {"message": f"Đã thêm khối {data.MaKhoiMoi} vào ngành {ma_nganh}"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
@app.put("/cap-nhat-chuyen-nganh/{ma_chuyen_nganh}")
def cap_nhat_chuyen_nganh(ma_chuyen_nganh: int, payload: ChuyenNganhUpdate):
    # Kiểm tra chuyên ngành tồn tại
    aql_check = """
    FOR cn IN ChuyenNganh
        FILTER cn.MaChuyenNganh == @ma_chuyen_nganh
        RETURN cn
    """
    existing_cn = list(db.aql.execute(aql_check, bind_vars={"ma_chuyen_nganh": ma_chuyen_nganh}))
    if not existing_cn:
        raise HTTPException(status_code=404, detail="Chuyên ngành không tồn tại")
    aql_update = """
    FOR cn IN ChuyenNganh
        FILTER cn.MaChuyenNganh == @ma_chuyen_nganh
        UPDATE cn WITH { TenChuyenNganh: @ten_moi } IN ChuyenNganh
        RETURN NEW
    """
    updated_cn = list(db.aql.execute(aql_update, bind_vars={
        "ma_chuyen_nganh": ma_chuyen_nganh,
        "ten_moi": payload.TenChuyenNganh
    }))

    if not updated_cn:
        raise HTTPException(status_code=500, detail="Cập nhật chuyên ngành thất bại")

    return {"message": "Cập nhật chuyên ngành thành công", "data": updated_cn[0]}



@app.put("/them-chuyen-nganh-theo-nganh/{ma_nganh_hoc}")
def them_chuyen_nganh_theo_nganh(ma_nganh_hoc: str, payload: CreateChuyenNganhRequest):
    try:
        # Kiểm tra ngành học có tồn tại bằng MaNganhHoc
        try:
            ma_nganh_hoc = int(ma_nganh_hoc)
        except ValueError:
            return JSONResponse(status_code=400, content={"error": "Mã ngành học không hợp lệ"})

        aql_check_nganh = """
        FOR n IN NganhHoc
            FILTER n.MaNganhHoc == @ma_nganh_hoc
            RETURN n
        """
        result_nganh = list(db.aql.execute(aql_check_nganh, bind_vars={"ma_nganh_hoc": ma_nganh_hoc}))
        if not result_nganh:
            return JSONResponse(status_code=404, content={"error": "Ngành học không tồn tại"})
        nganh_doc = result_nganh[0]

        # Kiểm tra chuyên ngành đã tồn tại bằng AQL
        aql_check_chuyen_nganh = """
        FOR cn IN ChuyenNganh
            FILTER cn.MaChuyenNganh == @ma_chuyen_nganh
            RETURN cn
        """
        result_cn = list(db.aql.execute(aql_check_chuyen_nganh, bind_vars={"ma_chuyen_nganh": payload.MaChuyenNganh}))
        if result_cn:
            return JSONResponse(status_code=400, content={"error": "Chuyên ngành đã tồn tại"})

        # AQL: Thêm chuyên ngành và liên kết với ngành + các khối
        aql_insert = """
        LET newChuyenNganh = FIRST(
            INSERT {
                MaChuyenNganh: @MaChuyenNganh,
                TenChuyenNganh: @TenChuyenNganh,
                MaNganhHoc: @MaNganhHoc
            } INTO ChuyenNganh RETURN NEW
        )

        INSERT {
            _from: newChuyenNganh._id,
            _to: @nganh_id
        } INTO ChuyenNganh_NganhHoc

        FOR khoi IN @KhoiXetTuyen
            INSERT {
                _from: newChuyenNganh._id,
                _to: CONCAT('KhoiXetTuyen/', khoi)
            } INTO ChuyenNganh_KhoiXetTuyen

        RETURN newChuyenNganh
        """

        bind_vars = {
            "MaChuyenNganh": payload.MaChuyenNganh,
            "TenChuyenNganh": payload.TenChuyenNganh,
            "MaNganhHoc": ma_nganh_hoc,
            "KhoiXetTuyen": payload.KhoiXetTuyen,
            "nganh_id": nganh_doc["_id"]
        }

        result = db.aql.execute(aql_insert, bind_vars=bind_vars)
        new_chuyen_nganh = list(result)[0]

        return JSONResponse(content={"message": "Thêm chuyên ngành thành công", "data": new_chuyen_nganh})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
@app.delete("/xoa-chuyen-nganh/{ma_chuyen_nganh}") 
def xoa_chuyen_nganh(ma_chuyen_nganh: str):
    try:
        # Chuyển ma_chuyen_nganh sang int nếu có thể
        try:
            ma_chuyen_nganh = int(ma_chuyen_nganh)
        except ValueError:
            return JSONResponse(status_code=400, content={"error": "Mã chuyên ngành không hợp lệ"})

        # Kiểm tra chuyên ngành tồn tại
        aql_check = """
        FOR cn IN ChuyenNganh
            FILTER cn.MaChuyenNganh == @ma_chuyen_nganh
            RETURN cn
        """
        result_cn = list(db.aql.execute(aql_check, bind_vars={"ma_chuyen_nganh": ma_chuyen_nganh}))
        if not result_cn:
            return JSONResponse(status_code=404, content={"error": "Chuyên ngành không tồn tại"})

        # Xóa các liên kết edges trong ChuyenNganh_NganhHoc
        aql_delete_edges_nganhhoc = """
        FOR edge IN ChuyenNganh_NganhHoc
            FILTER edge._from == CONCAT('ChuyenNganh/', @ma_chuyen_nganh)
            REMOVE edge IN ChuyenNganh_NganhHoc
        """
        db.aql.execute(aql_delete_edges_nganhhoc, bind_vars={"ma_chuyen_nganh": ma_chuyen_nganh})

        # Xóa các liên kết edges trong ChuyenNganh_KhoiXetTuyen
        aql_delete_edges_khoixettuyen = """
        FOR edge IN ChuyenNganh_KhoiXetTuyen
            FILTER edge._from == CONCAT('ChuyenNganh/', @ma_chuyen_nganh)
            REMOVE edge IN ChuyenNganh_KhoiXetTuyen
        """
        db.aql.execute(aql_delete_edges_khoixettuyen, bind_vars={"ma_chuyen_nganh": ma_chuyen_nganh})

        # Xóa chuyên ngành
        aql_delete_cn = """
        FOR cn IN ChuyenNganh
            FILTER cn.MaChuyenNganh == @ma_chuyen_nganh
            REMOVE cn IN ChuyenNganh
            RETURN OLD
        """
        deleted = list(db.aql.execute(aql_delete_cn, bind_vars={"ma_chuyen_nganh": ma_chuyen_nganh}))
        if not deleted:
            return JSONResponse(status_code=404, content={"error": "Xóa chuyên ngành thất bại"})

        return JSONResponse(content={"message": "Xóa chuyên ngành thành công", "data": deleted[0]})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})





# Chạy server FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
