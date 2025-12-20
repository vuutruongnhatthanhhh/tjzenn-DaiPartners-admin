"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import ImageBox from "@/components/image/ImageBox";
import EditorQuote from "@/components/editor/EditorQuote";
import {
  createAward,
  type Award,
  type AwardItem,
  type I18N,
} from "@/services/AwardService";

interface AwardAddProps {
  onClose: () => void;
  onAdd: (award: Award) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

const newItem = (): AwardItem => ({
  year: new Date().getFullYear(),
  description: { ...emptyI18N },
  images: [],
});

export default function AwardAdd({ onClose, onAdd }: AwardAddProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [content, setContent] = useState<I18N>({ ...emptyI18N });
  const [items, setItems] = useState<AwardItem[]>([newItem()]);

  // Image picker (chọn nhiều ảnh: mở picker, chọn 1 ảnh -> add vào item.images, có thể bấm chọn tiếp)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItemIndex, setPickerItemIndex] = useState<number | null>(null);

  const openPickerForItem = (idx: number) => {
    setPickerItemIndex(idx);
    setPickerOpen(true);
  };

  const addImageToItem = (url: string) => {
    if (pickerItemIndex === null) return;
    setItems((prev) => {
      const next = [...prev];
      const cur = next[pickerItemIndex];
      const exists = (cur.images || []).includes(url);
      next[pickerItemIndex] = {
        ...cur,
        images: exists ? cur.images : [...(cur.images || []), url],
      };
      return next;
    });
    setPickerOpen(false);
  };

  const removeImageFromItem = (itemIdx: number, imgIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = next[itemIdx];
      next[itemIdx] = {
        ...cur,
        images: (cur.images || []).filter((_, i) => i !== imgIdx),
      };
      return next;
    });
  };

  const addAwardItem = () => setItems((prev) => [...prev, newItem()]);
  const removeAwardItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    if (!(content.vi || content.en) && items.length === 0) {
      toast.warning(
        "Vui lòng nhập Content (VI/EN) hoặc thêm ít nhất 1 giải thưởng"
      );
      return false;
    }
    if (items.length === 0) {
      toast.warning("Vui lòng thêm ít nhất 1 giải thưởng");
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!Number.isFinite(Number(it.year)) || Number(it.year) <= 0) {
        toast.warning(`Năm không hợp lệ ở mục #${i + 1}`);
        return false;
      }
      if (
        !(it.description?.vi || it.description?.en) &&
        (it.images?.length ?? 0) === 0
      ) {
        toast.warning(`Mục #${i + 1}: cần có mô tả (VI/EN) hoặc ít nhất 1 ảnh`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const payload: Award = {
        content: { en: content.en || "", vi: content.vi || "" },
        items: (items || []).map((it) => ({
          year: Number(it.year),
          description: {
            en: it.description?.en || "",
            vi: it.description?.vi || "",
          },
          images: Array.isArray(it.images) ? it.images.filter(Boolean) : [],
        })),
      };

      const created = await createAward(payload);

      toast.success("Đã tạo awards thành công");

      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm awards thất bại", { description: message });
      console.error("Create award error:", message);
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

  const totalImages = useMemo(
    () => items.reduce((sum, it) => sum + (it.images?.length ?? 0), 0),
    [items]
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-7xl h-[90vh] relative flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Thêm awards{" "}
            <span className="text-sm font-semibold text-green-500">
              ({items.length} items / {totalImages} ảnh)
            </span>
          </h2>

          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="add-award-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Content i18n */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">Content (EN)</label>
              <EditorQuote
                initialContent={content.en || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, en: v }))}
                folder="awards"
              />
            </div>
            <div>
              <label className="block mb-1 text-white">Nội dung (VI)</label>
              <EditorQuote
                initialContent={content.vi || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, vi: v }))}
                folder="awards"
              />
            </div>
          </div>

          {/* Items */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Danh sách giải thưởng
            </h3>
            <button
              type="button"
              onClick={addAwardItem}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              Thêm item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-[#141416] p-4 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">
                      Item #{idx + 1}
                    </span>
                    <div className="w-[160px]">
                      <Input
                        label="Year"
                        type="number"
                        value={String(it.year ?? "")}
                        onChange={(v) =>
                          setItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], year: Number(v || 0) };
                            return next;
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAwardItem(idx)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 disabled:opacity-50 self-start md:self-auto"
                    disabled={isSubmitting || items.length === 1}
                    title={
                      items.length === 1 ? "Phải có ít nhất 1 item" : "Xóa item"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa item
                  </button>
                </div>

                {/* Description i18n */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-white">
                      Description (EN)
                    </label>
                    <EditorQuote
                      initialContent={it.description?.en || ""}
                      onContentChange={(v) =>
                        setItems((prev) => {
                          const next = [...prev];
                          const cur = next[idx];
                          next[idx] = {
                            ...cur,
                            description: { ...(cur.description || {}), en: v },
                          };
                          return next;
                        })
                      }
                      folder="awards"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-white">Mô tả (VI)</label>
                    <EditorQuote
                      initialContent={it.description?.vi || ""}
                      onContentChange={(v) =>
                        setItems((prev) => {
                          const next = [...prev];
                          const cur = next[idx];
                          next[idx] = {
                            ...cur,
                            description: { ...(cur.description || {}), vi: v },
                          };
                          return next;
                        })
                      }
                      folder="awards"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="flex items-center justify-between">
                  <label className="block text-white">
                    Images{" "}
                    <span className="text-xs text-gray-400">
                      ({it.images?.length ?? 0})
                    </span>
                  </label>

                  <button
                    type="button"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded bg-blue-600 disabled:opacity-50"
                    onClick={() => openPickerForItem(idx)}
                    disabled={isSubmitting}
                  >
                    <ImageIcon className="w-4 h-4" />+ Chọn ảnh
                  </button>
                </div>

                {!it.images || it.images.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Chưa có ảnh. Nhấn “+ Chọn ảnh” để thêm (có thể chọn nhiều
                    lần).
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {it.images.map((url, imgIdx) => (
                      <div
                        key={url + imgIdx}
                        className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`award-${idx}-${imgIdx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded p-1"
                          onClick={() => removeImageFromItem(idx, imgIdx)}
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
            ))}
          </div>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-award-form"
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
              "Thêm awards"
            )}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <ImageBox
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          folder="people"
          handleImageSelect={(url) => addImageToItem(url)}
        />
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-white">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
