"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ImageBox from "@/components/image/ImageBox";
import { updateOffice, type Office, type I18N } from "@/services/OfficeService";

interface OfficeUpdateProps {
  office: Office;
  onClose: () => void;
  onUpdate: (updated: Office) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function OfficeUpdate({
  office,
  onClose,
  onUpdate,
}: OfficeUpdateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState<I18N>(office.title || { ...emptyI18N });
  const [address, setAddress] = useState<I18N>(
    office.address || { ...emptyI18N }
  );

  const [image, setImage] = useState<string>(office.image ?? "");
  const [showImagePopup, setShowImagePopup] = useState(false);

  const [phone, setPhone] = useState(office.phone ?? "");
  const [email, setEmail] = useState(office.email ?? "");
  const [taxCode, setTaxCode] = useState(office.tax_code ?? "");
  const [ggMap, setGgMap] = useState(office.gg_map ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!(title.vi || title.en)) {
      toast.warning("Vui lòng nhập tiêu đề (VI hoặc EN)");
      return;
    }

    if (!(address.vi || address.en)) {
      toast.warning("Vui lòng nhập địa chỉ (VI hoặc EN)");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Partial<Office> = {
        title: { en: title.en || "", vi: title.vi || "" },
        address: { en: address.en || "", vi: address.vi || "" },
        image: image.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        tax_code: taxCode.trim() || null,
        gg_map: ggMap.trim() || null,
      };

      const updated = await updateOffice(office.id as number, payload);

      toast.success("Cập nhật office thành công", {
        description: <strong>{t(title) || t(address)}</strong>,
      });

      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: message });
      console.error("Update office error:", message);
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
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-5xl h-[85vh] relative flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật office</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="update-office-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Image */}
          <div>
            <label className="block mb-1 text-white">Ảnh office</label>

            {image ? (
              <div className="relative w-[260px] h-[150px] mb-2 rounded-lg overflow-hidden border border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="office"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-md px-2 py-1 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                  onClick={() => setImage("")}
                  disabled={isSubmitting}
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Chưa chọn ảnh.</p>
            )}

            <button
              type="button"
              className="mt-2 text-sm text-blue-400 disabled:opacity-50"
              onClick={() => setShowImagePopup(true)}
              disabled={isSubmitting}
            >
              + Chọn ảnh từ thư viện
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title (EN)"
              value={title.en || ""}
              onChange={(v) => setTitle((p) => ({ ...p, en: v }))}
            />
            <Input
              label="Tiêu đề (VI)"
              value={title.vi || ""}
              onChange={(v) => setTitle((p) => ({ ...p, vi: v }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address (EN)"
              value={address.en || ""}
              onChange={(v) => setAddress((p) => ({ ...p, en: v }))}
            />
            <Input
              label="Địa chỉ (VI)"
              value={address.vi || ""}
              onChange={(v) => setAddress((p) => ({ ...p, vi: v }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Điện thoại"
              value={phone}
              onChange={(v) => setPhone(v)}
              placeholder="VD: 0901xxxxxx"
            />
            <Input
              label="Email"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="VD: contact@company.com"
            />
            <Input
              label="Mã số thuế"
              value={taxCode}
              onChange={(v) => setTaxCode(v)}
              placeholder="VD: 031xxxxxxx"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Google Map (link)"
              value={ggMap}
              onChange={(v) => setGgMap(v)}
            />
          </div>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-office-form"
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
              "Cập nhật office"
            )}
          </button>
        </div>
      </div>

      {showImagePopup && (
        <ImageBox
          open={showImagePopup}
          onClose={() => setShowImagePopup(false)}
          folder="offices"
          handleImageSelect={(url) => {
            setImage(url);
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
      <input
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 placeholder-gray-400"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
