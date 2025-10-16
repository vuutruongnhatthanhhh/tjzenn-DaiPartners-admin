"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { X, FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageBox from "@/components/image/ImageBox";
import CvBox from "@/components/our-people/CvBox"; // <-- dùng lại CvBox
import { createPerson, OurPeople, I18N } from "@/services/OurPeopleService";

interface AddPeopleModalProps {
  onClose: () => void;
  onAdd: (person: OurPeople) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

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
  for (let i = 0; i < len; i++) out.push({ vi: vi[i] ?? "", en: en[i] ?? "" });
  return out;
};

function getFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").pop() || "";
    return decodeURIComponent(seg || "").split("?")[0];
  } catch {
    const seg = url.split("/").pop() || "";
    return decodeURIComponent(seg || "").split("?")[0];
  }
}

export default function OurPeopleAdd({ onClose, onAdd }: AddPeopleModalProps) {
  const [form, setForm] = useState<OurPeople>({
    avatar: "",
    email: "",
    name: { ...emptyI18N },
    position: { ...emptyI18N },
    area: { ...emptyI18N },
    cv: { ...emptyI18N }, // chọn URL từ storage
    professional_summary: { ...emptyI18N },
    notable_engagements: [],
    bar_admissions: [],
    education: [],
    awards: [], // mảng URL ảnh award
  });

  const [showImagePopup, setShowImagePopup] = useState(false);

  // textareas -> array I18N
  const [engVI, setEngVI] = useState("");
  const [engEN, setEngEN] = useState("");
  const [barVI, setBarVI] = useState("");
  const [barEN, setBarEN] = useState("");
  const [eduVI, setEduVI] = useState("");
  const [eduEN, setEduEN] = useState("");

  // AWARDS
  const [awards, setAwards] = useState<string[]>([]);
  const [showAwardsPicker, setShowAwardsPicker] = useState(false);
  const addAward = (url: string) => {
    setAwards((prev) => [...prev, url]);
    setShowAwardsPicker(false);
  };
  const removeAward = (idx: number) => {
    setAwards((prev) => prev.filter((_, i) => i !== idx));
  };

  // ====== MIRROR chỉ cho TEXT (giữ nguyên), KHÔNG áp dụng cho CV ======
  const [autoSync, setAutoSync] = useState(true); // dùng cho text fields
  const mirrorRef = useRef({
    name: "",
    position: "",
    area: "",
    professional_summary: "",
    eng: "",
    bar: "",
    edu: "",
  });
  const onEnChange =
    (
      key: keyof Pick<
        OurPeople,
        "name" | "position" | "area" | "professional_summary"
      >
    ) =>
    (v: string) => {
      const prev = form[key] || {};
      const shouldMirror =
        autoSync && (!prev.vi || prev.vi === (mirrorRef.current as any)[key]);
      const next: I18N = { en: v, vi: shouldMirror ? v : prev.vi || "" };
      (mirrorRef.current as any)[key] = v;
      setForm({ ...form, [key]: next } as OurPeople);
    };
  const onViChange =
    (
      key: keyof Pick<
        OurPeople,
        "name" | "position" | "area" | "professional_summary"
      >
    ) =>
    (v: string) => {
      const prev = form[key] || {};
      setForm({ ...form, [key]: { ...prev, vi: v } } as OurPeople);
    };
  const onPairEnChange = (pair: "eng" | "bar" | "edu") => (v: string) => {
    const viVal = { eng: engVI, bar: barVI, edu: eduVI }[pair];
    const shouldMirror =
      autoSync && (!viVal || viVal === (mirrorRef.current as any)[pair]);
    if (pair === "eng") setEngEN(v);
    if (pair === "bar") setBarEN(v);
    if (pair === "edu") setEduEN(v);
    if (shouldMirror) {
      if (pair === "eng") setEngVI(v);
      if (pair === "bar") setBarVI(v);
      if (pair === "edu") setEduVI(v);
    }
    (mirrorRef.current as any)[pair] = v;
  };
  const onPairViChange = (pair: "eng" | "bar" | "edu") => (v: string) => {
    if (pair === "eng") setEngVI(v);
    if (pair === "bar") setBarVI(v);
    if (pair === "edu") setEduVI(v);
  };

  // ==== CV: CHỌN TỪ POPUP THƯ MỤC cv/ (KHÔNG mirror EN->VI) ====
  const [showCvPickerEN, setShowCvPickerEN] = useState(false);
  const [showCvPickerVI, setShowCvPickerVI] = useState(false);

  const handleDeleteCvEN = () => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), en: "" } }));
  };
  const handleDeleteCvVI = () => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), vi: "" } }));
  };

  const pickEN = (url: string) => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), en: url } }));
  };
  const pickVI = (url: string) => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), vi: url } }));
  };

  // Preview: hiển thị tên file, click tải về (không có badge “đồng bộ từ EN”)
  const cvEnPreview = useMemo(
    () =>
      form.cv.en
        ? { name: getFilenameFromUrl(form.cv.en), href: form.cv.en }
        : null,
    [form.cv.en]
  );
  const cvViPreview = useMemo(
    () =>
      form.cv.vi
        ? { name: getFilenameFromUrl(form.cv.vi), href: form.cv.vi }
        : null,
    [form.cv.vi]
  );

  // ====== Submit ======
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.avatar) return toast.warning("Vui lòng chọn ảnh đại diện");
    if (!form.email) return toast.warning("Vui lòng nhập email");
    if (!form.name?.vi && !form.name?.en)
      return toast.warning("Vui lòng nhập tên (VI/EN)");
    if (!form.cv?.vi || !form.cv?.en) return toast.warning("Vui lòng chọn CV");

    try {
      setIsSubmitting(true);

      // KHÔNG mirror CV
      const payload: OurPeople = {
        ...form,
        cv: { en: form.cv.en || "", vi: form.cv.vi || "" },
        notable_engagements: zipI18NArray(engVI, engEN),
        bar_admissions: zipI18NArray(barVI, barEN),
        education: zipI18NArray(eduVI, eduEN),
        awards,
      };

      const created = await createPerson(payload);
      toast.success("Đã thêm nhân sự thành công");
      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm nhân sự thất bại", { description: message });
      console.error("Create person error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khóa scroll nền khi mở modal
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-7xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Thêm nhân sự (Our People)
          </h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="add-people-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Avatar */}
          <div>
            <label className="block mb-1 text-white">Ảnh đại diện</label>
            {form.avatar ? (
              <div className="relative w-32 h-32 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover rounded border border-gray-700"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-xs"
                  onClick={() => setForm({ ...form, avatar: "" })}
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="text-sm text-blue-400 disabled:opacity-50"
              onClick={() => setShowImagePopup(true)}
              disabled={isSubmitting}
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
              label="Name (EN)"
              value={form.name.en || ""}
              onChange={onEnChange("name")}
            />
            <Input
              label="Tên (VI)"
              value={form.name.vi || ""}
              onChange={onViChange("name")}
            />
          </div>

          {/* Position i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Position (EN)"
              value={form.position.en || ""}
              onChange={onEnChange("position")}
            />
            <Input
              label="Chức danh (VI)"
              value={form.position.vi || ""}
              onChange={onViChange("position")}
            />
          </div>

          {/* Area i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Area (EN)"
              value={form.area.en || ""}
              onChange={onEnChange("area")}
            />
            <Input
              label="Khu vực (VI)"
              value={form.area.vi || ""}
              onChange={onViChange("area")}
            />
          </div>

          {/* CV: chọn từ popup thư mục cv/ */}
          <div className="grid grid-cols-2 gap-4">
            {/* EN */}
            <div>
              <label className="block mb-1 text-white">CV (EN)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
                  onClick={() => setShowCvPickerEN(true)}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4" /> Chọn CV
                </button>
                {form.cv.en && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs px-2 py-2 rounded bg-red-600 disabled:opacity-50"
                    onClick={handleDeleteCvEN}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                )}
              </div>
              {cvEnPreview && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FileText className="w-4 h-4" />
                  <a
                    href={cvEnPreview.href}
                    download={cvEnPreview.name}
                    className="truncate underline hover:opacity-80"
                    title={cvEnPreview.name}
                  >
                    {cvEnPreview.name}
                  </a>
                </div>
              )}
            </div>

            {/* VI */}
            <div>
              <label className="block mb-1 text-white">CV (VI)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
                  onClick={() => setShowCvPickerVI(true)}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4" /> Chọn CV
                </button>

                {form.cv.vi && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs px-2 py-2 rounded bg-red-600 disabled:opacity-50"
                    onClick={handleDeleteCvVI}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                )}
              </div>

              {cvViPreview && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FileText className="w-4 h-4" />
                  <a
                    href={cvViPreview.href}
                    download={cvViPreview.name}
                    className="truncate underline hover:opacity-80"
                    title={cvViPreview.name}
                  >
                    {cvViPreview.name}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Professional Summary i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Professional summary (EN)"
              value={form.professional_summary.en || ""}
              onChange={onEnChange("professional_summary")}
            />
            <Textarea
              label="Tóm tắt nghề nghiệp (VI)"
              value={form.professional_summary.vi || ""}
              onChange={onViChange("professional_summary")}
            />
          </div>

          {/* Notable engagements */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Notable engagements (EN)"
              value={engEN}
              onChange={onPairEnChange("eng")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Thương vụ tiêu biểu (VI)"
              value={engVI}
              onChange={onPairViChange("eng")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          {/* Bar admissions */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Bar admissions (EN)"
              value={barEN}
              onChange={onPairEnChange("bar")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Quốc gia hành nghề (VI)"
              value={barVI}
              onChange={onPairViChange("bar")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          {/* Education */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Education (EN)"
              value={eduEN}
              onChange={onPairEnChange("edu")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Học vấn (VI)"
              value={eduVI}
              onChange={onPairViChange("edu")}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          {/* Awards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-white">Awards (ảnh vuông)</label>
              <button
                type="button"
                className="text-xs px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
                onClick={() => setShowAwardsPicker(true)}
                disabled={isSubmitting}
              >
                + Chọn ảnh award
              </button>
            </div>

            {awards.length === 0 ? (
              <p className="text-sm text-gray-400">
                Chưa có ảnh award. Nhấn “+ Chọn ảnh award” để thêm.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {awards.map((url, idx) => (
                  <div
                    key={url + idx}
                    className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`award-${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded p-1"
                      onClick={() => removeAward(idx)}
                      title="Xóa ảnh này"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-people-form"
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
              "Thêm nhân sự"
            )}
          </button>
        </div>
      </div>

      {/* Image picker cho Avatar */}
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

      {/* CV pickers */}
      {showCvPickerEN && (
        <CvBox
          open={showCvPickerEN}
          onClose={() => setShowCvPickerEN(false)}
          onSelect={(url) => pickEN(url)}
        />
      )}
      {showCvPickerVI && (
        <CvBox
          open={showCvPickerVI}
          onClose={() => setShowCvPickerVI(false)}
          onSelect={(url) => pickVI(url)}
        />
      )}

      {/* Image picker cho Awards */}
      {showAwardsPicker && (
        <ImageBox
          open={showAwardsPicker}
          onClose={() => setShowAwardsPicker(false)}
          folder="people"
          handleImageSelect={(url) => addAward(url)}
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
