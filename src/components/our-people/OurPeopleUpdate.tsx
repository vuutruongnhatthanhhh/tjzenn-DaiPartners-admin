"use client";

import { useEffect, useMemo, useState } from "react";
import { X, FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageBox from "@/components/image/ImageBox";
import CvBox from "@/components/our-people/CvBox"; // <-- thêm đường dẫn phù hợp
import { OurPeople, I18N, updatePerson } from "@/services/OurPeopleService";
import { supabase } from "@/lib/supabaseClient";
import EditorShort from "@/components/editor/EditorShort";

interface OurPeopleUpdateProps {
  person: OurPeople;
  onClose: () => void;
  onUpdate: (updated: OurPeople) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

// ---------- helpers ----------
const lines = (s: string) =>
  (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

const zipI18NArray = (viStr: string, enStr: string): I18N[] => {
  const vi = lines(viStr);
  const en = lines(enStr);
  const len = Math.max(vi.length, en.length);
  const out: I18N[] = [];
  for (let i = 0; i < len; i++) out.push({ vi: vi[i] ?? "", en: en[i] ?? "" });
  return out;
};

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

// Map public URL -> storage path (images-storage/<path>)
function getStoragePathFromPublicUrl(url: string): string | null {
  if (!url) return null;
  const marker = "/images-storage/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return decodeURIComponent(path);
}
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

export default function OurPeopleUpdate({
  person,
  onClose,
  onUpdate,
}: OurPeopleUpdateProps) {
  const [form, setForm] = useState<OurPeople>({
    id: person.id,
    avatar: person.avatar || "",
    email: person.email || "",
    name: person.name || { ...emptyI18N },
    position: person.position || { ...emptyI18N },
    area: person.area || { ...emptyI18N },
    cv: person.cv || { ...emptyI18N },
    professional_summary: person.professional_summary || { ...emptyI18N },
    notable_engagements: person.notable_engagements || [],
    bar_admissions: person.bar_admissions || [],
    education: person.education || [],
    awards: person.awards || [],
    created_at: person.created_at,
    updated_at: person.updated_at,
  });

  // ===== Textareas =====
  const [engVI, setEngVI] = useState("");
  const [engEN, setEngEN] = useState("");
  const [barVI, setBarVI] = useState("");
  const [barEN, setBarEN] = useState("");
  const [eduVI, setEduVI] = useState("");
  const [eduEN, setEduEN] = useState("");

  // ===== Awards =====
  const [awards, setAwards] = useState<string[]>([]);
  const [showAwardsPicker, setShowAwardsPicker] = useState(false);
  const addAward = (url: string) => {
    setAwards((prev) => [...prev, url]);
    setShowAwardsPicker(false);
  };
  const removeAward = (idx: number) => {
    setAwards((prev) => prev.filter((_, i) => i !== idx));
  };

  // ===== CV (EN/VI) via popup =====
  const [showCvPickerEN, setShowCvPickerEN] = useState(false);
  const [showCvPickerVI, setShowCvPickerVI] = useState(false);

  // ===== Init =====
  useEffect(() => {
    setEngVI(
      (person.notable_engagements || []).map((x) => x.vi || "").join("\n")
    );
    setEngEN(
      (person.notable_engagements || []).map((x) => x.en || "").join("\n")
    );
    setBarVI((person.bar_admissions || []).map((x) => x.vi || "").join("\n"));
    setBarEN((person.bar_admissions || []).map((x) => x.en || "").join("\n"));
    setEduVI((person.education || []).map((x) => x.vi || "").join("\n"));
    setEduEN((person.education || []).map((x) => x.en || "").join("\n"));
    setAwards(person.awards || []);
  }, [person]);

  // ===== Validate =====
  const isValid = useMemo(() => {
    if (!form.avatar) return false;
    if (!form.email) return false;
    if (!(form.name?.vi || form.name?.en)) return false;
    if (!(form.cv?.vi && form.cv?.en)) return false;
    return true;
  }, [form]);

  // ===== UI state =====
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== Submit =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isValid) {
      toast.warning("Vui lòng nhập đủ Avatar, Email, Họ tên, CV (VI/EN)");
      return;
    }

    const newCvEnUrl = form.cv?.en || "";
    const newCvViUrl = form.cv?.vi || "";

    try {
      setIsSubmitting(true);

      // Update payload (KHÔNG mirror, KHÔNG xóa file storage)
      const payload: Partial<OurPeople> = {
        avatar: form.avatar,
        email: form.email,
        name: form.name,
        position: form.position,
        area: form.area,
        cv: { en: newCvEnUrl, vi: newCvViUrl },
        professional_summary: form.professional_summary,
        notable_engagements: zipI18NArray(engVI, engEN),
        bar_admissions: zipI18NArray(barVI, barEN),
        education: zipI18NArray(eduVI, eduEN),
        awards,
      };

      const updated = await updatePerson(person.id as string, payload);

      toast.success("Cập nhật nhân sự thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: message });
      console.error("Update person error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== Delete handlers (mỗi field độc lập) =====
  const handleDeleteCvEN = () => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), en: "" } }));
  };
  const handleDeleteCvVI = () => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), vi: "" } }));
  };

  // ===== Pick from CvBox (mỗi field độc lập) =====
  const pickEN = (url: string) => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), en: url } }));
  };
  const pickVI = (url: string) => {
    setForm((f) => ({ ...f, cv: { ...(f.cv || {}), vi: url } }));
  };

  // ===== UI =====
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-7xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật nhân sự</h2>
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
          id="update-people-form"
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
            required
            type="email"
          />

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full name (EN)"
              value={form.name?.en || ""}
              onChange={(v) =>
                setForm({ ...form, name: { ...(form.name || {}), en: v } })
              }
            />
            <Input
              label="Họ tên (VI)"
              value={form.name?.vi || ""}
              onChange={(v) =>
                setForm({ ...form, name: { ...(form.name || {}), vi: v } })
              }
              required={!form.name?.en}
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Position (EN)"
              value={form.position?.en || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  position: { ...(form.position || {}), en: v },
                })
              }
            />
            <Input
              label="Chức danh (VI)"
              value={form.position?.vi || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  position: { ...(form.position || {}), vi: v },
                })
              }
            />
          </div>

          {/* Area */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Area (EN)"
              value={form.area?.en || ""}
              onChange={(v) =>
                setForm({ ...form, area: { ...(form.area || {}), en: v } })
              }
            />
            <Input
              label="Lĩnh vực/Khu vực (VI)"
              value={form.area?.vi || ""}
              onChange={(v) =>
                setForm({ ...form, area: { ...(form.area || {}), vi: v } })
              }
            />
          </div>

          {/* CV EN/VI via popup */}
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
                {form.cv?.en && (
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
              {form.cv?.en ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FileText className="w-4 h-4" />
                  <a
                    href={form.cv.en}
                    download={getFilenameFromUrl(form.cv.en)}
                    className="truncate underline hover:opacity-80"
                    title={getFilenameFromUrl(form.cv.en)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getFilenameFromUrl(form.cv.en)}
                  </a>
                </div>
              ) : null}
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
                {form.cv?.vi && (
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
              {form.cv?.vi ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FileText className="w-4 h-4" />
                  <a
                    href={form.cv.vi}
                    download={getFilenameFromUrl(form.cv.vi)}
                    className="truncate underline hover:opacity-80"
                    title={getFilenameFromUrl(form.cv.vi)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getFilenameFromUrl(form.cv.vi)}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* Professional Summary - dùng Editor EN/VI độc lập */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">
                Professional summary (EN)
              </label>
              <EditorShort
                initialContent={form.professional_summary?.en || ""}
                onContentChange={(v) =>
                  setForm({
                    ...form,
                    professional_summary: {
                      ...(form.professional_summary || {}),
                      en: v,
                    },
                  })
                }
                folder="people"
              />
            </div>

            <div>
              <label className="block mb-1 text-white">
                Tóm tắt nghề nghiệp (VI)
              </label>
              <EditorShort
                initialContent={form.professional_summary?.vi || ""}
                onContentChange={(v) =>
                  setForm({
                    ...form,
                    professional_summary: {
                      ...(form.professional_summary || {}),
                      vi: v,
                    },
                  })
                }
                folder="people"
              />
            </div>
          </div>

          {/* Notable, Bar, Education */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Notable engagements (EN)"
              value={engEN}
              onChange={setEngEN}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Thương vụ tiêu biểu (VI)"
              value={engVI}
              onChange={setEngVI}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Bar admissions (EN)"
              value={barEN}
              onChange={setBarEN}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Quốc gia hành nghề (VI)"
              value={barVI}
              onChange={setBarVI}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Education (EN)"
              value={eduEN}
              onChange={setEduEN}
              placeholder="Khi xuống dòng tự động thêm gạch đầu dòng bên client"
            />
            <Textarea
              label="Học vấn (VI)"
              value={eduVI}
              onChange={setEduVI}
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
            form="update-people-form"
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
              "Cập nhật nhân sự"
            )}
          </button>
        </div>
      </div>

      {/* Avatar picker */}
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

      {/* Awards picker */}
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

// ---------- Reusable Inputs ----------
function Input({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-white">{label}</label>
      <input
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
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
