from typing import Optional, TypeVar
from pydantic import BaseModel

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