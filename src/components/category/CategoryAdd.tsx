// app/(wherever)/CategoryAdd.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { I18N, Category } from "@/services/CategoryService";
import { createCategory } from "@/services/CategoryService";

interface AddCategoryModalProps {
  onClose: () => void;
  onAdd: (category: Category) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

export default function CategoryAdd({ onClose, onAdd }: AddCategoryModalProps) {
  const [form, setForm] = useState<Category>({
    name: { ...emptyI18N },
  });

  // Auto-sync EN -> VI cho tiện nhập nhanh
  const [autoSync, setAutoSync] = useState(true);
  const mirrorRef = useRef({ name: "" });

  const onEnChange = (key: keyof Pick<Category, "name">) => (v: string) => {
    const prev = (form[key] as I18N) || {};
    const shouldMirror =
      autoSync && (!prev.vi || prev.vi === mirrorRef.current.name);
    const next: I18N = { en: v, vi: shouldMirror ? v : prev.vi || "" };
    mirrorRef.current.name = v;
    setForm({ ...form, [key]: next } as Category);
  };

  const onViChange = (key: keyof Pick<Category, "name">) => (v: string) => {
    const prev = (form[key] as I18N) || {};
    setForm({ ...form, [key]: { ...prev, vi: v } } as Category);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name?.vi && !form.name?.en) {
      return toast.warning("Vui lòng nhập tên danh mục (VI hoặc EN)");
    }

    try {
      setIsSubmitting(true);

      const payload: Category = {
        name: {
          en: form.name?.en || "",
          vi: form.name?.vi || "",
        },
      };

      const created = await createCategory(payload);
      toast.success("Đã tạo danh mục thành công");
      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm danh mục thất bại", { description: message });
      console.error("Create category error:", message);
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
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-xl h-[50vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Thêm danh mục (Category)
            </h2>
            <div className="flex items-center gap-4">
              {/* Toggle auto sync EN -> VI */}
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
          id="add-category-form"
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
            form="add-category-form"
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
              "Thêm danh mục"
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
