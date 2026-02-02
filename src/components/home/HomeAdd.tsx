// src/components/home/HomeAdd.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createHome, type Home, type I18N } from "@/services/HomeService";

interface HomeAddProps {
  onClose: () => void;
  onAdd: (item: Home) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

const t = (i18n?: I18N | null, locale: "vi" | "en" = "vi") =>
  ((i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "") as string).trim();

export default function HomeAdd({ onClose, onAdd }: HomeAddProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<I18N>({ ...emptyI18N });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!(content.vi || content.en)) {
      toast.warning("Vui lòng nhập Content (VI hoặc EN)");
      return;
    }

    try {
      setIsSubmitting(true);

      const created = await createHome({
        content: { en: content.en || "", vi: content.vi || "" },
      });

      toast.success("ĐÃ TẠO HOME THÀNH CÔNG", {
        description: <strong>{t(created.content)}</strong>,
      });

      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm home thất bại", { description: message });
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
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Thêm home</h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="add-home-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          <Section title="Content">
            <TwoCols>
              <Textarea
                label="Content (EN)"
                value={content.en || ""}
                onChange={(v) => setContent((p) => ({ ...p, en: v }))}
              />
              <Textarea
                label="Nội dung (VI)"
                value={content.vi || ""}
                onChange={(v) => setContent((p) => ({ ...p, vi: v }))}
              />
            </TwoCols>
          </Section>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-home-form"
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
              "Thêm home"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-3">
      <div className="text-white font-semibold">{title}</div>
      {children}
    </div>
  );
}

function TwoCols({ children }: { children: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
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
        className="w-full min-h-[120px] px-4 py-2 rounded-lg bg-black text-white border border-gray-600 placeholder-gray-400"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
