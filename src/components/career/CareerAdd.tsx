// app/(wherever)/CareerAdd.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { I18N, Career } from "@/services/CareerService";
import { createCareer } from "@/services/CareerService";

interface AddCareerModalProps {
  onClose: () => void;
  onAdd: (career: Career) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

// helpers cho dạng [ ] từ textarea (mỗi dòng = 1 item)
const lines = (s: string) =>
  (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

const zipI18NArray = (viStr: string, enStr: string) => {
  const vi = lines(viStr);
  const en = lines(enStr);
  const len = Math.max(vi.length, en.length);
  const out: I18N[] = [];
  for (let i = 0; i < len; i++) out.push({ vi: vi[i] ?? "", en: en[i] ?? "" });
  return out;
};

export default function CareerAdd({ onClose, onAdd }: AddCareerModalProps) {
  const [form, setForm] = useState<Career>({
    name: { ...emptyI18N },
    location: { ...emptyI18N },
    age: { ...emptyI18N },
    salary: { ...emptyI18N },
    type: { ...emptyI18N },
    gender: { ...emptyI18N },
    job_description: { ...emptyI18N },
    // NOTE: service đã đổi job_requirements: I18N[]; ở form mình nhập qua 2 textarea rồi zip
    job_requirements: [] as unknown as Career["job_requirements"],
    email: "",
  });

  // ====== Mirror EN -> VI (toggle) ======
  const [autoSync, setAutoSync] = useState(true);
  const mirrorRef = useRef({
    name: "",
    location: "",
    age: "",
    salary: "",
    type: "",
    gender: "",
    job_description: "",
    // cặp yêu cầu (textarea pair)
    req: "",
  });

  const onEnChange =
    (
      key: keyof Pick<
        Career,
        | "name"
        | "location"
        | "age"
        | "salary"
        | "type"
        | "gender"
        | "job_description"
      >
    ) =>
    (v: string) => {
      const prev = (form[key] as I18N) || {};
      const shouldMirror =
        autoSync && (!prev.vi || prev.vi === (mirrorRef.current as any)[key]);
      const next: I18N = { en: v, vi: shouldMirror ? v : prev.vi || "" };
      (mirrorRef.current as any)[key] = v;
      setForm({ ...form, [key]: next } as Career);
    };

  const onViChange =
    (
      key: keyof Pick<
        Career,
        | "name"
        | "location"
        | "age"
        | "salary"
        | "type"
        | "gender"
        | "job_description"
      >
    ) =>
    (v: string) => {
      const prev = (form[key] as I18N) || {};
      setForm({ ...form, [key]: { ...prev, vi: v } } as Career);
    };

  // ==== Job requirements: textarea pair -> mảng I18N ====
  const [reqEN, setReqEN] = useState("");
  const [reqVI, setReqVI] = useState("");

  const onReqEnChange = (v: string) => {
    const shouldMirror =
      autoSync && (!reqVI || reqVI === mirrorRef.current.req);
    setReqEN(v);
    if (shouldMirror) setReqVI(v);
    mirrorRef.current.req = v;
  };
  const onReqViChange = (v: string) => setReqVI(v);

  // ====== Submit ======
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name?.vi && !form.name?.en)
      return toast.warning("Vui lòng nhập vị trí tuyển dụng (VI/EN)");

    try {
      setIsSubmitting(true);

      const payload: Career = {
        ...form,
        name: { en: form.name.en || "", vi: form.name.vi || "" },
        location: { en: form.location?.en || "", vi: form.location?.vi || "" },
        age: { en: form.age?.en || "", vi: form.age?.vi || "" },
        salary: { en: form.salary?.en || "", vi: form.salary?.vi || "" },
        type: { en: form.type?.en || "", vi: form.type?.vi || "" },
        gender: { en: form.gender?.en || "", vi: form.gender?.vi || "" },
        job_description: {
          en: form.job_description?.en || "",
          vi: form.job_description?.vi || "",
        },
        // 🎯 chuyển 2 textarea thành mảng I18N[]
        job_requirements: zipI18NArray(
          reqVI,
          reqEN
        ) as Career["job_requirements"],
      };

      const created = await createCareer(payload);
      toast.success("Đã thêm tin tuyển dụng thành công");
      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm tin tuyển dụng thất bại", { description: message });
      console.error("Create career error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-5xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Thêm tin tuyển dụng (Career)
            </h2>
            <div className="flex items-center gap-4">
              {/* <label className="text-sm text-gray-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
                Tự đồng bộ EN → VI
              </label> */}
              <button
                className="text-white"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          id="add-career-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Position (EN)"
              value={form.name.en || ""}
              onChange={onEnChange("name")}
            />
            <Input
              label="Vị trí tuyển dụng (VI)"
              value={form.name.vi || ""}
              onChange={onViChange("name")}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location (EN)"
              value={form.location?.en || ""}
              onChange={onEnChange("location")}
            />
            <Input
              label="Địa điểm (VI)"
              value={form.location?.vi || ""}
              onChange={onViChange("location")}
            />
          </div>

          {/* Age */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age (EN)"
              value={form.age?.en || ""}
              onChange={onEnChange("age")}
            />
            <Input
              label="Độ tuổi (VI)"
              value={form.age?.vi || ""}
              onChange={onViChange("age")}
            />
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary (EN)"
              value={form.salary?.en || ""}
              onChange={onEnChange("salary")}
            />
            <Input
              label="Mức lương (VI)"
              value={form.salary?.vi || ""}
              onChange={onViChange("salary")}
            />
          </div>

          {/* Type */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Job type (EN)"
              value={form.type?.en || ""}
              onChange={onEnChange("type")}
            />
            <Input
              label="Hình thức (VI)"
              value={form.type?.vi || ""}
              onChange={onViChange("type")}
            />
          </div>

          {/* Gender */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gender (EN)"
              value={form.gender?.en || ""}
              onChange={onEnChange("gender")}
            />
            <Input
              label="Giới tính (VI)"
              value={form.gender?.vi || ""}
              onChange={onViChange("gender")}
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Job description (EN)"
              value={form.job_description?.en || ""}
              onChange={onEnChange("job_description")}
              placeholder="Mô tả công việc – EN"
            />
            <Textarea
              label="Mô tả công việc (VI)"
              value={form.job_description?.vi || ""}
              onChange={onViChange("job_description")}
              placeholder="Mô tả công việc – VI"
            />
          </div>

          {/* Requirements: textarea pair -> list */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Job requirements (EN)"
              value={reqEN}
              onChange={onReqEnChange}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Yêu cầu công việc (VI)"
              value={reqVI}
              onChange={onReqViChange}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          {/* Email */}
          <Input
            label="Email liên hệ"
            value={form.email || ""}
            onChange={(v) => setForm({ ...form, email: v })}
          />
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-career-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu…
              </>
            ) : (
              "Thêm tin tuyển dụng"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Small UI helpers ----------------- */
function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block mb-1 text-white">{label}</label>
      <input
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-white">{label}</label>
      <textarea
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 min-h-28 whitespace-pre-wrap"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
