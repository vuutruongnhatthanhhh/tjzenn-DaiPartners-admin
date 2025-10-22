// app/(wherever)/CategoryUpdate.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { I18N, Category } from "@/services/CategoryService";
import { updateCategory } from "@/services/CategoryService";

interface CategoryUpdateProps {
  category: Category;
  onClose: () => void;
  onUpdate: (updated: Category) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

export default function CategoryUpdate({
  category,
  onClose,
  onUpdate,
}: CategoryUpdateProps) {
  const [form, setForm] = useState<Category>({
    id: category.id,
    name: category.name || { ...emptyI18N },
    created_at: category.created_at,
  });

  // Auto mirror EN -> VI (nhập nhanh)
  const [autoSync, setAutoSync] = useState(true);
  const mirrorRef = useRef({ name: "" });

  const onEnChange = (key: keyof Pick<Category, "name">) => (v: string) => {
    const prev = (form[key] as I18N) || {};
    const shouldMirror =
      autoSync && (!prev.vi || prev.vi === mirrorRef.current.name);
    setForm({
      ...form,
      [key]: { en: v, vi: shouldMirror ? v : prev.vi || "" },
    } as Category);
    mirrorRef.current.name = v;
  };

  const onViChange = (key: keyof Pick<Category, "name">) => (v: string) => {
    const prev = (form[key] as I18N) || {};
    setForm({ ...form, [key]: { ...prev, vi: v } } as Category);
  };

  const isValid = useMemo(() => !!(form.name?.vi || form.name?.en), [form]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isValid) return toast.warning("Vui lòng nhập tên danh mục (VI/EN)");

    try {
      setIsSubmitting(true);
      const payload: Partial<Category> = {
        name: { en: form.name?.en || "", vi: form.name?.vi || "" },
      };

      const updated = await updateCategory(form.id as number, payload);
      toast.success("Cập nhật danh mục thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: msg });
      console.error("Update category error:", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-xl h-[70vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Cập nhật danh mục</h2>
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
          id="update-category-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category name (EN)"
              value={form.name?.en || ""}
              onChange={onEnChange("name")}
            />
            <Input
              label="Tên danh mục (VI)"
              value={form.name?.vi || ""}
              onChange={onViChange("name")}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-category-form"
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
              "Cập nhật danh mục"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */
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
