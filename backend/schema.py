from typing import Optional, TypeVar
from pydantic import BaseModel
from typing import List
T = TypeVar('T')

class FormXetTuyenRequest(BaseModel):
    fullName: str
    dob: str
    cccd: str
    email: str
    phone: str
    address: str
    gender: str
    truong: str
    khoi: str
    diem: str
    namTotNghiep: str
    duHoc: bool
    maDotXetTuyen: str
    maHinhThucXetTuyen: str
    nganhHocId: str
    fileUrl: str

class ResponseSchema(BaseModel):
    detail: str
    result: Optional[T] = None

class NganhHocRequest(BaseModel):
    MaNganhHoc: int
    TenNganhHoc: str
    DiemDau: float
    DiemTHPTQG: Optional[float] = None
    DiemDGNL: Optional[float] = None
    MaBacHoc: Optional[int] = None
    TrangThai: Optional[bool] = None
class CreateChuyenNganhRequest(BaseModel):
    MaChuyenNganh: int
    TenChuyenNganh: str
class FormXetTuyenRequest(BaseModel):
    fullName: str
    dob: str
    cccd: str
    email: str
    phone: str
    address: str
    gender: str
    truong: str
    khoi: str
    diem: str
    namTotNghiep: str
    duHoc: bool
    maDotXetTuyen: str
    maHinhThucXetTuyen: str
    nganhHoc: str
class Tinh(BaseModel):
    MaTinh: str
    TenTinh: str
    _id: str 
    _key: str 
    _rev: str 
class NganhHocRequest(BaseModel):
    MaNganhHoc: int
    TenNganhHoc: str
    DiemDau: float
    DiemTHPTQG: Optional[float] = None
    DiemDGNL: Optional[float] = None
    MaBacHoc: Optional[int] = None
    TrangThai: Optional[bool] = None
class CreateChuyenNganhRequest(BaseModel):
    MaChuyenNganh: int
    TenChuyenNganh: str
class MonHoc(BaseModel):
    tenMonHoc: str
class KhoiXetTuyen(BaseModel):
    MaKhoi: str
class MonHocInput(BaseModel):
    tenMonHoc: str
    maKhoi: str
class KhoiInput(BaseModel):
    maKhoi: str
class KhoiUpdateByMa(BaseModel):
    maKhoiCu: str
    maKhoiMoi: str
class UpdateTenMonHocByNameRequest(BaseModel):
    maKhoi: str
    tenMonHocCu: str
    tenMonHocMoi: str
class DeleteMonHoc(BaseModel):
    maKhoi: str
    tenMonHoc: str
class DeleteKhoiXetTuyen(BaseModel):
    MaKhoi: str
class ChuyenNganhUpdate(BaseModel):
    TenChuyenNganh: str
class AddKhoiXetTuyenPayload(BaseModel):
    ma_nganh: int
    ma_khoi: str
class KhoiChange(BaseModel):
    MaKhoiMoi: str 
 