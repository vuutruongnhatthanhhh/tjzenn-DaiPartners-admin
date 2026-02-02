"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { slugify } from "@/utils/slugify";

import {
  updatePracticeChild,
  type PracticeChild,
  type I18N,
} from "@/services/PracticeChildService";
import { getAllPractices, type Practice } from "@/services/PracticeService";
import EditorQuote from "../editor/EditorQuote";

interface PracticeChildUpdateProps {
  child: PracticeChild;
  onClose: () => void;
  onUpdate: (updated: PracticeChild) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function PracticeChildUpdate({
  child,
  onClose,
  onUpdate,
}: PracticeChildUpdateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState<I18N>(child.title || { ...emptyI18N });
  const [url, setUrl] = useState<string>(child.url || "");
  const [content, setContent] = useState<I18N>(
    child.content || { ...emptyI18N },
  );
  const [parentId, setParentId] = useState<number | null>(child.parent ?? null);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoadingPractices, setIsLoadingPractices] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingPractices(true);
        const res = await getAllPractices({ page: 1, limit: 200, search: "" });
        if (mounted) setPractices(res.data ?? []);
      } catch {
        toast.error("Không tải được danh sách practices");
      } finally {
        if (mounted) setIsLoadingPractices(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!(title.vi || title.en)) {
      toast.warning("Vui lòng nhập tiêu đề (VI hoặc EN)");
      return;
    }
    if (!url.trim()) {
      toast.warning("Vui lòng nhập URL");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Partial<PracticeChild> = {
        title: { en: title.en || "", vi: title.vi || "" },
        content: { en: content.en || "", vi: content.vi || "" },
        url: slugify(url.trim()),
        parent: parentId,
      };

      const updated = await updatePracticeChild(child.id as number, payload);

      toast.success("Cập nhật practice child thành công", {
        description: <strong>{t(title)}</strong>,
      });

      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: message });
      console.error("Update practice child error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // lock body scroll khi mở modal
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
            Cập nhật practice child
          </h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="update-practice-child-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Title */}
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

          {/* URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="URL (unique)"
              value={url}
              onChange={(v) => setUrl(slugify(v))}
            />
          </div>

          {/* Parent Practice */}
          <div>
            <label className="block mb-2 text-white font-medium">
              Practice cha (Parent)
            </label>
            <select
              value={parentId ?? ""}
              onChange={(e) =>
                setParentId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
            >
              <option value="">-- Không chọn --</option>
              {isLoadingPractices ? (
                <option disabled>Đang tải...</option>
              ) : (
                practices.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {t(pr.title)} ({pr.url})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">Content (EN)</label>
              <EditorQuote
                initialContent={content.en || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, en: v }))}
                folder="practice-child"
              />
            </div>
            <div>
              <label className="block mb-1 text-white">Nội dung (VI)</label>
              <EditorQuote
                initialContent={content.vi || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, vi: v }))}
                folder="practice-child"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-practice-child-form"
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
              "Cập nhật practice child"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Small UI helper */
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
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 placeholder-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
