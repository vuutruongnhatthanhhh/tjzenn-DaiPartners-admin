// components/blog/BlogUpdate.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Editor from "@/components/editor/Editor";
import { updateBlog, type Blog, type I18N } from "@/services/BlogService";
import { getAllCategories, type Category } from "@/services/CategoryService";
import { slugify } from "@/utils/slugify";

interface BlogUpdateProps {
  blog: Blog; // { id, name{vi,en}, slug{vi,en}, content{vi,en}, category }
  onClose: () => void;
  onUpdate: (updatedBlog: Blog) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };
const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function BlogUpdate({
  blog,
  onClose,
  onUpdate,
}: BlogUpdateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState<I18N>(blog.name || { ...emptyI18N });
  const [slug, setSlug] = useState<I18N>(blog.slug || { ...emptyI18N });
  const [content, setContent] = useState<I18N>(
    blog.content || { ...emptyI18N }
  );
  const [category, setCategory] = useState<number | "">(blog.category ?? "");

  const [catOptions, setCatOptions] = useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  // Load categories cho dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingCats(true);
        const res = await getAllCategories({ page: 1, limit: 100, search: "" });
        if (mounted) setCatOptions(res.data);
      } catch {
        toast.error("Không tải được danh mục");
      } finally {
        setIsLoadingCats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto update slug khi đổi tiêu đề
  useEffect(() => {
    setSlug({
      en: slugify(name.en || ""),
      vi: slugify(name.vi || ""),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name.en, name.vi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!(name.vi || name.en)) {
      toast.warning("Vui lòng nhập tiêu đề (VI hoặc EN)");
      return;
    }
    if (category === "") {
      toast.warning("Vui lòng chọn danh mục");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Partial<Blog> = {
        name: { en: name.en || "", vi: name.vi || "" },
        slug: { en: slug.en || "", vi: slug.vi || "" },
        content: { en: content.en || "", vi: content.vi || "" },
        category: Number(category),
      };

      const updated = await updateBlog(blog.id as number, payload);
      toast.success("Cập nhật bài viết thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || "Lỗi không xác định";
      toast.error("Cập nhật thất bại", { description: message });
      console.error("Update blog error:", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-3xl h-[90vh] relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật bài viết</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="update-blog-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tiêu đề (EN)"
              value={name.en || ""}
              onChange={(v) => setName((p) => ({ ...p, en: v }))}
            />
            <Input
              label="Tiêu đề (VI)"
              value={name.vi || ""}
              onChange={(v) => setName((p) => ({ ...p, vi: v }))}
            />
          </div>

          {/* Slug */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Slug (EN)"
              value={slug.en || ""}
              onChange={(v) => setSlug((p) => ({ ...p, en: slugify(v) }))}
            />
            <Input
              label="Slug (VI)"
              value={slug.vi || ""}
              onChange={(v) => setSlug((p) => ({ ...p, vi: slugify(v) }))}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 text-white">Danh mục</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 disabled:opacity-60"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isLoadingCats}
            >
              <option value="">-- Chọn danh mục --</option>
              {catOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">Nội dung (EN)</label>
              <Editor
                initialContent={content.en || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, en: v }))}
                folder="blog"
              />
            </div>
            <div>
              <label className="block mb-1 text-white">Nội dung (VI)</label>
              <Editor
                initialContent={content.vi || ""}
                onContentChange={(v) => setContent((p) => ({ ...p, vi: v }))}
                folder="blog"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-blog-form"
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
              "Cập nhật bài viết"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- Small UI helpers -------- */
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
        className="w-full px-4 py-2 rounded-lg bg黑 text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
