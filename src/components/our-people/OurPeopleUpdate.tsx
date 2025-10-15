"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import ImageBox from "@/components/image/ImageBox";
import { OurPeople, I18N, updatePerson } from "@/services/OurPeopleService";

interface OurPeopleUpdateProps {
  person: OurPeople;
  onClose: () => void;
  onUpdate: (updated: OurPeople) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

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
  for (let i = 0; i < len; i++) {
    out.push({ vi: vi[i] ?? "", en: en[i] ?? "" });
  }
  return out;
};

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

  // textareas cho mảng i18n
  const [engVI, setEngVI] = useState("");
  const [engEN, setEngEN] = useState("");
  const [barVI, setBarVI] = useState("");
  const [barEN, setBarEN] = useState("");
  const [eduVI, setEduVI] = useState("");
  const [eduEN, setEduEN] = useState("");
  // awards (dùng chung)
  const [awardsText, setAwardsText] = useState("");

  // khởi tạo textarea từ dữ liệu cũ
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
    setAwardsText((person.awards || []).join("\n"));
  }, [person]);

  const isValid = useMemo(() => {
    if (!form.avatar) return false;
    if (!form.email) return false;
    if (!(form.name?.vi || form.name?.en)) return false;
    if (!(form.position?.vi || form.position?.en)) return false;
    return true;
  }, [form]);

  const [showImagePopup, setShowImagePopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.warning(
        "Vui lòng nhập đủ Avatar, Email và Họ tên/Position (vi/en)"
      );
      return;
    }

    const payload: Partial<OurPeople> = {
      avatar: form.avatar,
      email: form.email,
      name: form.name,
      position: form.position,
      area: form.area,
      cv: form.cv,
      professional_summary: form.professional_summary,
      notable_engagements: zipI18NArray(engVI, engEN),
      bar_admissions: zipI18NArray(barVI, barEN),
      education: zipI18NArray(eduVI, eduEN),
      awards: lines(awardsText),
    };

    try {
      const updated = await updatePerson(person.id as string, payload);
      toast.success("Cập nhật nhân sự thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      toast.error("Cập nhật thất bại", {
        description:
          err?.message || err?.error?.message || "Lỗi không xác định",
      });
      console.error("Update person error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-2xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật nhân sự</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
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
            <label className="block mb-1 text-white">Ảnh đại diện (WebP)</label>
            {form.avatar && (
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
            )}
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
              label="Họ tên (VI)"
              value={form.name?.vi || ""}
              onChange={(v) =>
                setForm({ ...form, name: { ...(form.name || {}), vi: v } })
              }
            />
            <Input
              label="Full name (EN)"
              value={form.name?.en || ""}
              onChange={(v) =>
                setForm({ ...form, name: { ...(form.name || {}), en: v } })
              }
            />
          </div>

          {/* Position i18n */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Area i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lĩnh vực/Khu vực (VI)"
              value={form.area?.vi || ""}
              onChange={(v) =>
                setForm({ ...form, area: { ...(form.area || {}), vi: v } })
              }
            />
            <Input
              label="Area (EN)"
              value={form.area?.en || ""}
              onChange={(v) =>
                setForm({ ...form, area: { ...(form.area || {}), en: v } })
              }
            />
          </div>

          {/* CV links i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CV link (VI)"
              value={form.cv?.vi || ""}
              onChange={(v) =>
                setForm({ ...form, cv: { ...(form.cv || {}), vi: v } })
              }
            />
            <Input
              label="CV link (EN)"
              value={form.cv?.en || ""}
              onChange={(v) =>
                setForm({ ...form, cv: { ...(form.cv || {}), en: v } })
              }
            />
          </div>

          {/* Professional Summary i18n */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Tóm tắt nghề nghiệp (VI)"
              value={form.professional_summary?.vi || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  professional_summary: {
                    ...(form.professional_summary || {}),
                    vi: v,
                  },
                })
              }
            />
            <Textarea
              label="Professional summary (EN)"
              value={form.professional_summary?.en || ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  professional_summary: {
                    ...(form.professional_summary || {}),
                    en: v,
                  },
                })
              }
            />
          </div>

          {/* Notable engagements */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Notable engagements (VI) – mỗi dòng 1 ý"
              value={engVI}
              onChange={setEngVI}
              placeholder="- Đại diện bị đơn vụ 200 tỷ\n- Tư vấn chiến lược…"
            />
            <Textarea
              label="Notable engagements (EN) – one per line"
              value={engEN}
              onChange={setEngEN}
              placeholder="- Represented respondent…\n- Advised on…"
            />
          </div>

          {/* Bar admissions */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Bar admissions (VI) – mỗi dòng 1 mục"
              value={barVI}
              onChange={setBarVI}
              placeholder="New York (2019)\nCalifornia (2021)"
            />
            <Textarea
              label="Bar admissions (EN) – one per line"
              value={barEN}
              onChange={setBarEN}
              placeholder="New York (2019)\nCalifornia (2021)"
            />
          </div>

          {/* Education */}
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Education (VI) – mỗi dòng 1 mục"
              value={eduVI}
              onChange={setEduVI}
              placeholder="ĐH Luật TP.HCM — Cử nhân Luật (2013)"
            />
            <Textarea
              label="Education (EN) – one per line"
              value={eduEN}
              onChange={setEduEN}
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
            form="update-people-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Cập nhật nhân sự
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
