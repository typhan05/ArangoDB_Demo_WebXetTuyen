"use client";

import useApi from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputField } from "./form/InputField";
import { SelectField } from "./form/SelectField";
import { DatePickerField } from "./form/DatePickerField";
import { toast } from "sonner";

const schema = z
  .object({
    fullName: z.string().min(1, "Vui lòng nhập họ và tên"),
    dob: z.string().min(1, "Vui lòng chọn ngày sinh"),
    cccd: z
      .string()
      .min(12, "CCCD phải gồm 12 chữ số")
      .max(12, "CCCD phải gồm 12 chữ số")
      .regex(/^\d+$/, "CCCD chỉ được chứa chữ số"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(/^\d{10}$/, "Số điện thoại gồm 10 chữ số"),
    address: z.string().min(1, "Vui lòng nhập địa chỉ"),
    gender: z.string().min(1, "Vui lòng chọn giới tính"),
    tinh: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
    truong: z.string().min(1, "Vui lòng chọn trường THPT"),
    bacHoc: z.string().min(1, "Vui lòng chọn bậc học"),
    nganhHoc: z.string().min(1, "Vui lòng chọn ngành học"),
    khoi: z.string().min(1, "Vui lòng chọn tổ hợp"),
    diem: z.record(
      z
        .string()
        .min(1, "Vui lòng nhập điểm")
        .refine((val) => !isNaN(Number(val)), { message: "Phải là số" })
        .refine((val) => Number(val) >= 0 && Number(val) <= 10, {
          message: "Điểm phải từ 0 đến 10",
        })
    ),
    namTotNghiep: z.string().optional(),
    file: z.any().optional(),
    duHoc: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const total = Object.values(data.diem || {}).reduce((sum, val) => {
        const num = Number(val);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);
      return total >= 15;
    },
    {
      message: "Tổng điểm phải từ 15 trở lên",
      path: ["diem"],
    }
  );

interface TinhTP {
  MaTinh: string;
  TenTinh: string;
}
interface Truong {
  MaTruong: string;
  TenTruong: string;
}
interface NghanhHoc {
  MaNganhHoc: number;
  TenNganhHoc: string;
}
interface MonHoc {
  tenMonHoc: number;
  _id: string;
}
interface KhoiXet {
  MaKhoi: number;
  _id: string;
}

type FormData = z.infer<typeof schema>;

const educationLevels = ["Đại học", "Cao đẳng", "Trung cấp"];

export default function RegistrationForm() {
  const [selectedMaTinh, setSelectedMaTinh] = useState("");
  const [selectedMaNghanh, setSelectedMaNghanh] = useState<number>();
  const [selectedMaKhoi, setSelectedMaKhoi] = useState("");

  const { data: dataTinhTp, callApi: callApiTinhTp } = useApi<TinhTP[]>(
    "GET",
    "/tinh-tp"
  );
  const { data: dataThpt, callApi: callApiThpt } = useApi<Truong[]>(
    "GET",
    "/truong-thpt"
  );
  const { data: dataNganhHoc, callApi: callApiNghanhHoc } = useApi<NghanhHoc[]>(
    "GET",
    "/nganh-hoc"
  );
  const { data: dataKhoi, callApi: callApiKhoi } = useApi<KhoiXet[]>(
    "GET",
    "/khoi-xet-tuyen"
  );
  const { data: dataMonHoc, callApi: callApiMonHoc } = useApi<MonHoc[]>(
    "GET",
    "/mon-hoc-theo-khoi"
  );

  const { callApi: createForm } = useApi<any, FormData>(
    "POST",
    "/create-form-xet-tuyen"
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      dob: "",
      cccd: "",
      email: "",
      phone: "",
      address: "",
      gender: "",
      tinh: "",
      truong: "",
      bacHoc: "",
      nganhHoc: "",
      khoi: "",
      diem: {},
      duHoc: false,
      namTotNghiep: "",
      file: undefined,
    },
  });

  useEffect(() => {
    callApiTinhTp();
    callApiNghanhHoc();
  }, []);

  useEffect(() => {
    if (selectedMaTinh) {
      callApiThpt({ ma_tinh: selectedMaTinh });
    }
  }, [selectedMaTinh]);

  useEffect(() => {
    if (selectedMaNghanh) {
      callApiKhoi({ ma_nganh: selectedMaNghanh });
    }
  }, [selectedMaNghanh]);

  useEffect(() => {
    if (selectedMaKhoi) {
      callApiMonHoc({ ma_khoi: selectedMaKhoi });
    }
  }, [selectedMaKhoi]);

  const onSubmit = async (data: FormData) => {
    const diemFormatted = dataMonHoc
      ?.map((mon) => {
        const value = data.diem[mon._id];
        return `[${mon.tenMonHoc}:${value}]`;
      })
      .join("; ");

    const payload = {
      ...data,
      maDotXetTuyen: "5",
      maHinhThucXetTuyen: "HB12",
      diem: diemFormatted,
    };
    const { error } = await createForm(payload as any);

    if (!error) {
      toast.success("Gửi form xét tuyển thành công!");
      reset();
    } else {
      toast.error("Gửi thất bại: " + error);
    }
  };

  const onError = (errors: any) => {
    console.log("❌ Form có lỗi:", errors);
    // errors sẽ chứa toàn bộ lỗi từ Zod
  };

  return (
    <div className="md:min-h-screen flex items-center container mx-auto py-8">
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="space-y-6 w-full shadow-2xl p-8 rounded-2xl max-w-4xl mx-auto"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            ĐĂNG KÝ XÉT TUYỂN ĐẠI HỌC BẰNG KẾT QUẢ LỚP 12
          </h1>
          <p className="text-sm text-gray-500">
            THỜI GIAN: 01/01/2025 - 25/06/2025
          </p>
        </div>

        <h2 className="section-title">THÔNG TIN HỌC SINH</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            id="gender"
            label="Giới tính"
            placeholder="Chọn giới tính"
            options={[
              { label: "Nam", value: "male" },
              { label: "Nữ", value: "female" },
            ]}
            value={watch("gender")}
            onChange={(val) => setValue("gender", val)}
            error={errors.gender}
          />

          <InputField
            id="fullName"
            label="Họ và tên học sinh"
            placeholder="Nhập họ và tên"
            register={register}
            error={errors.fullName}
          />

          <DatePickerField
            id="dob"
            label="Ngày sinh"
            value={watch("dob") ? new Date(watch("dob")) : null}
            onChange={(date) => {
              setValue("dob", date ? date.toISOString() : "");
            }}
            error={errors.dob}
          />

          <InputField
            id="cccd"
            label="Số CCCD"
            placeholder="Nhập số CCCD"
            register={register}
            error={errors.cccd}
            inputProps={{
              maxLength: 12,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />

          <InputField
            id="email"
            label="Email"
            placeholder="Email"
            register={register}
            error={errors.email}
          />

          <InputField
            id="phone"
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            register={register}
            error={errors.phone}
            inputProps={{
              maxLength: 10,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />

          <InputField
            id="address"
            label="Địa chỉ"
            placeholder="Địa chỉ"
            register={register}
            error={errors.address}
          />

          <SelectField
            id="tinh"
            label="Tỉnh/Thành phố"
            placeholder="Chọn tỉnh/thành phố"
            options={
              dataTinhTp?.map((item) => ({
                label: item.TenTinh,
                value: item.MaTinh,
              })) || []
            }
            value={watch("tinh")}
            onChange={(val) => {
              setValue("tinh", val);
              setSelectedMaTinh(val);
            }}
            error={errors.tinh}
          />

          <SelectField
            id="truong"
            label="Trường THPT"
            placeholder="Chọn trường THPT"
            options={
              dataThpt?.map((item) => ({
                label: item.TenTruong,
                value: item.MaTruong,
              })) || []
            }
            value={watch("truong")}
            onChange={(val) => setValue("truong", val)}
            error={errors.truong}
          />
        </div>
        <h2 className="section-title">THÔNG TIN ĐĂNG KÝ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            id="bacHoc"
            label="Bậc học"
            placeholder="Chọn bậc học"
            options={educationLevels.map((level) => ({
              label: level,
              value: level,
            }))}
            value={watch("bacHoc")}
            onChange={(val) => setValue("bacHoc", val)}
            error={errors.bacHoc}
          />

          <div>
            <SelectField
              id="nganhHoc"
              label="Ngành học"
              placeholder="Chọn ngành học"
              options={
                dataNganhHoc?.map((nganh) => ({
                  label: nganh.TenNganhHoc,
                  value: String(nganh.MaNganhHoc),
                })) || []
              }
              value={watch("nganhHoc")}
              onChange={(val) => {
                setValue("nganhHoc", val);
                setSelectedMaNghanh(Number(val));
              }}
              error={errors.nganhHoc}
            />
            <p className="note">
              (Ghi chú: Thí sinh được phép chuyển đổi ngành phù hợp sau 1 Học kỳ
              đến 1 Năm học theo quy chế của Bộ Giáo dục và Đào tạo.)
            </p>
          </div>

          <SelectField
            id="khoi"
            label="Tổ hợp xét tuyển"
            placeholder="Chọn tổ hợp"
            options={
              dataKhoi?.map((khoi) => ({
                label: khoi.MaKhoi.toString(),
                value: khoi.MaKhoi.toString(),
              })) || []
            }
            value={watch("khoi")}
            onChange={(val) => {
              setValue("khoi", val);
              setSelectedMaKhoi(val);
            }}
            error={errors.khoi}
          />
        </div>
        {dataMonHoc && (
          <>
            <p className="text-sm text-center text-gray-500">
              Nhập kết quả học tập (Tôi cam đoan số điểm trên hoàn toàn đúng với
              học bạ của tôi) <span className="required">*</span>
            </p>
            {dataMonHoc.map((mon) => (
              <InputField
                key={mon._id}
                id={`diem-${mon._id}`}
                name={`diem.${mon._id}`}
                label={mon.tenMonHoc.toString()}
                placeholder="Nhập điểm"
                type="number"
                register={register}
                error={errors.diem?.[mon._id]}
                inputProps={{
                  min: 0,
                  max: 10,
                  step: 0.01,
                }}
              />
            ))}
            {errors.diem?.message && (
              <p className="text-red-500 text-sm">
                {errors.diem.message as any}
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Checkbox id="duHoc" {...register("duHoc")} />
            <Label htmlFor="duHoc">Nguyện vọng du học</Label>
          </div>

          <Input
            {...register("namTotNghiep")}
            placeholder="Năm tốt nghiệp (bỏ qua nếu chưa tốt nghiệp)"
            type="number"
          />
          <Input {...register("file")} type="file" />
        </div>
        <div className="text-center">
          <Button type="submit" className="mt-6 cursor-pointer">
            Đăng ký xét tuyển
          </Button>
        </div>
      </form>
      <Toaster />
    </div>
  );
}
