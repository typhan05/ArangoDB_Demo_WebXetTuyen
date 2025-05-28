from datetime import datetime
from fastapi import FastAPI, File, Query, UploadFile
from arango import ArangoClient
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from file_uploader import FileUploader
from schema import ResponseSchema, FormXetTuyenRequest, NganhHocRequest, CreateChuyenNganhRequest
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
                STT: chuyenNganh.MaChuyenNganh,
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
            TrangThai: @trang_thai
          } IN NganhHoc
          RETURN NEW
        """

        bind_vars_update = {
            "ma_nganh": payload.MaNganhHoc,
            "diem_dau": payload.DiemDau,
            "ma_bac_hoc": payload.MaBacHoc,
            "ten_nganh_hoc": payload.TenNganhHoc,
            "trang_thai": payload.TrangThai
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
def list_forms():
    try:
        aql = """
        FOR form IN FormXetTuyen
          FOR nganh IN OUTBOUND form FormXetTuyen_NganhHoc
            RETURN {
              form: form,
              nganh: nganh.TenNganhHoc
            }
        """
        cursor = db.aql.execute(aql)
        forms = list(cursor)
        return JSONResponse(content=forms)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# Chạy server FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
