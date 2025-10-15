"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import ImageBox from "@/components/image/ImageBox";
import { createPerson, OurPeople, I18N } from "@/services/OurPeopleService";

interface AddPeopleModalProps {
  onClose: () => void;
  onAdd: (person: OurPeople) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

export default function OurPeopleAdd({ onClose, onAdd }: AddPeopleModalProps) {
  const [form, setForm] = useState<OurPeople>({
    avatar: "",
    email: "",
    name: { ...emptyI18N },
    position: { ...emptyI18N },
    area: { ...emptyI18N },
    cv: { ...emptyI18N },
    professional_summary: { ...emptyI18N },
    notable_engagements: [],
    bar_admissions: [],
    education: [],
    awards: [],
  });

  const [showImagePopup, setShowImagePopup] = useState(false);

  // textareas -> array I18N
  const [engVI, setEngVI] = useState("");
  const [engEN, setEngEN] = useState("");
  const [barVI, setBarVI] = useState("");
  const [barEN, setBarEN] = useState("");
  const [eduVI, setEduVI] = useState("");
  const [eduEN, setEduEN] = useState("");
  const [awardsText, setAwardsText] = useState("");

  // Bật/tắt auto sync EN theo VI (mặc định bật)
  const [autoSync, setAutoSync] = useState(true);

  // giữ “bản sao” cuối cùng để nhận biết EN có bị user sửa tay không
  const mirrorRef = useRef({
    name: "",
    position: "",
    area: "",
    cv: "",
    professional_summary: "",
    eng: "",
    bar: "",
    edu: "",
  });

  const lines = (s: string) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const zipI18NArray = (viStr: string, enStr: string) => {
    const vi = lines(viStr);
    const en = lines(enStr);
    const len = Math.max(vi.length, en.length);
    const out: I18N[] = [];
    for (let i = 0; i < len; i++)
      out.push({ vi: vi[i] ?? "", en: en[i] ?? "" });
    return out;
  };

  // === Helpers auto-sync field i18n (input) ===
  const onViChange =
    (
      key: keyof Pick<
        OurPeople,
        "name" | "position" | "area" | "cv" | "professional_summary"
      >
    ) =>
    (v: string) => {
      const prev = form[key] || {};
      const shouldMirror =
        autoSync &&
        // EN đang trống hoặc EN đang bằng bản sao trước đó
        (!prev.en || prev.en === (mirrorRef.current as any)[key]);
      const next: I18N = {
        vi: v,
        en: shouldMirror ? v : prev.en || "",
      };
      // cập nhật mirror
      (mirrorRef.current as any)[key] = v;
      setForm({ ...form, [key]: next } as OurPeople);
    };

  const onEnChange =
    (
      key: keyof Pick<
        OurPeople,
        "name" | "position" | "area" | "cv" | "professional_summary"
      >
    ) =>
    (v: string) => {
      const prev = form[key] || {};
      setForm({ ...form, [key]: { ...prev, en: v } } as OurPeople);
    };

  // === Helpers auto-sync textarea pairs (mảng) ===
  const onPairViChange = (pair: "eng" | "bar" | "edu") => (v: string) => {
    const enVal = { eng: engEN, bar: barEN, edu: eduEN }[pair];
    const mirrorKey = pair;
    const shouldMirror =
      autoSync && (!enVal || enVal === (mirrorRef.current as any)[mirrorKey]);
    // cập nhật state VI
    if (pair === "eng") setEngVI(v);
    if (pair === "bar") setBarVI(v);
    if (pair === "edu") setEduVI(v);
    // mirror EN nếu cần
    if (shouldMirror) {
      if (pair === "eng") setEngEN(v);
      if (pair === "bar") setBarEN(v);
      if (pair === "edu") setEduEN(v);
    }
    (mirrorRef.current as any)[mirrorKey] = v;
  };

  const onPairEnChange = (pair: "eng" | "bar" | "edu") => (v: string) => {
    if (pair === "eng") setEngEN(v);
    if (pair === "bar") setBarEN(v);
    if (pair === "edu") setEduEN(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.avatar) return toast.warning("Vui lòng chọn ảnh đại diện");
    if (!form.email) return toast.warning("Vui lòng nhập email");
    if (!form.name?.vi && !form.name?.en)
      return toast.warning("Vui lòng nhập họ tên (vi/en)");

    const payload: OurPeople = {
      ...form,
      notable_engagements: zipI18NArray(engVI, engEN),
      bar_admissions: zipI18NArray(barVI, barEN),
      education: zipI18NArray(eduVI, eduEN),
      awards: lines(awardsText),
    };

    try {
      const created = await createPerson(payload);
      toast.success("Đã thêm nhân sự thành công");
      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm nhân sự thất bại");
      console.error("Create person error:", message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-2xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Thêm nhân sự (Our People)
          </h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Toggle autosync */}
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            Tự đồng bộ EN theo VI
          </label>
        </div>

        {/* Form */}
        <form
          id="add-people-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Avatar */}
          <div>
            <label className="block mb-1 text-white">Ảnh đại diện (WebP)</label>
            {form.avatar ? (
              <div className="relative w-32 h-32 mb-2">
                <img
                  src={form.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover rounded border border-gray-700"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-xs"
                  onClick={() => setForm({ ...form, avatar: "" })}
                >
                  ✕
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="text-sm text-blue-400"
              onClick={() => setShowImagePopup(true)}
            >
              + Chọn ảnh từ thư viện
            </button>
          </div>

          {/* Email */}
          <Input
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          {/* Name i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tên (VI)"
              value={form.name.vi || ""}
              onChange={onViChange("name")}
            />
            <Input
              label="Name (EN)"
              value={form.name.en || ""}
              onChange={onEnChange("name")}
            />
          </div>

          {/* Position i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chức danh (VI)"
              value={form.position.vi || ""}
              onChange={onViChange("position")}
            />
            <Input
              label="Position (EN)"
              value={form.position.en || ""}
              onChange={onEnChange("position")}
            />
          </div>

          {/* Area i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Khu vực (VI)"
              value={form.area.vi || ""}
              onChange={onViChange("area")}
            />
            <Input
              label="Area (EN)"
              value={form.area.en || ""}
              onChange={onEnChange("area")}
            />
          </div>

          {/* CV links i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CV (VI)"
              value={form.cv.vi || ""}
              onChange={onViChange("cv")}
            />
            <Input
              label="CV (EN)"
              value={form.cv.en || ""}
              onChange={onEnChange("cv")}
            />
          </div>

          {/* Professional Summary i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Tóm tắt nghề nghiệp (VI)"
              value={form.professional_summary.vi || ""}
              onChange={onViChange("professional_summary")}
            />
            <Textarea
              label="Professional summary (EN)"
              value={form.professional_summary.en || ""}
              onChange={onEnChange("professional_summary")}
            />
          </div>

          {/* Notable engagements */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Notable engagements (VI) – mỗi dòng 1 ý"
              value={engVI}
              onChange={onPairViChange("eng")}
              placeholder="- Đại diện bị đơn vụ 200 tỷ\n- Tư vấn chiến lược…"
            />
            <Textarea
              label="Notable engagements (EN) – one item per line"
              value={engEN}
              onChange={onPairEnChange("eng")}
              placeholder="- Represented respondent…\n- Advised on…"
            />
          </div>

          {/* Bar admissions */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Bar admissions (VI) – mỗi dòng 1 mục"
              value={barVI}
              onChange={onPairViChange("bar")}
              placeholder="New York (2019)\nCalifornia (2021)"
            />
            <Textarea
              label="Bar admissions (EN) – one per line"
              value={barEN}
              onChange={onPairEnChange("bar")}
              placeholder="New York (2019)\nCalifornia (2021)"
            />
          </div>

          {/* Education */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Education (VI) – mỗi dòng 1 mục"
              value={eduVI}
              onChange={onPairViChange("edu")}
              placeholder="ĐH Luật TP.HCM — Cử nhân Luật (2013)"
            />
            <Textarea
              label="Education (EN) – one per line"
              value={eduEN}
              onChange={onPairEnChange("edu")}
              placeholder="HCMC University of Law — LL.B. (2013)"
            />
          </div>

          {/* Awards (dùng chung) */}
          <Textarea
            label="Awards (dùng chung) – mỗi dòng 1 giải"
            value={awardsText}
            onChange={setAwardsText}
            placeholder="Lawyer of the Year 2022\nTop 40 Under 40"
          />
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-people-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Thêm nhân sự
          </button>
        </div>
      </div>

      {/* Image picker */}
      {showImagePopup && (
        <ImageBox
          open={showImagePopup}
          onClose={() => setShowImagePopup(false)}
          folder="people"
          handleImageSelect={(url) => {
            setForm({ ...form, avatar: url });
            setShowImagePopup(false);
          }}
        />
      )}
    </div>
  );
}

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
        required
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
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 min-h-28"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
