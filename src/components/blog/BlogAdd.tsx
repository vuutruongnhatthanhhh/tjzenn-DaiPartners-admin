// components/blog/BlogAdd.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBlog, type Blog, type I18N } from "@/services/BlogService";
import { getAllCategories, type Category } from "@/services/CategoryService";
import Editor from "@/components/editor/Editor";
import { slugify } from "@/utils/slugify";

interface AddBlogModalProps {
  onClose: () => void;
  onAdd: (blog: Blog) => void;
}

const emptyI18N: I18N = { vi: "", en: "" };

export default function BlogAdd({ onClose, onAdd }: AddBlogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState<I18N>({ ...emptyI18N });
  const [slug, setSlug] = useState<I18N>({ ...emptyI18N });
  const [shortDes, setShortDes] = useState<I18N>({ ...emptyI18N });
  const [content, setContent] = useState<I18N>({ ...emptyI18N });

  const [category, setCategory] = useState<number | "">("");
  const [catOptions, setCatOptions] = useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  // chỉ cần remount VI editor khi EN thay đổi
  const [viKey, setViKey] = useState(0);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingCats(true);
        const res = await getAllCategories({ page: 1, limit: 100, search: "" });
        setCatOptions(res.data);
      } catch {
        toast.error("Không tải được danh mục");
      } finally {
        setIsLoadingCats(false);
      }
    })();
  }, []);

  // Slug EN theo title EN
  useEffect(() => {
    setSlug((prev) => ({ ...prev, en: slugify(name.en || "") }));
  }, [name.en]);

  // Slug VI theo tiêu đề VI
  useEffect(() => {
    setSlug((prev) => ({ ...prev, vi: slugify(name.vi || "") }));
  }, [name.vi]);

  // EN -> VI (Title)
  const handleNameChange = (lang: "en" | "vi", value: string) => {
    if (lang === "en") {
      setName({ en: value, vi: value });
    } else {
      // VI chỉ cập nhật VI, không ảnh hưởng EN
      setName((p) => ({ ...p, vi: value }));
    }
  };

  // EN -> VI (Content)
  const handleContentChange = (lang: "en" | "vi", value: string) => {
    if (lang === "en") {
      setContent({ en: value, vi: value });
      // remount VI editor để phản ánh nội dung mới từ EN
      setViKey((k) => k + 1);
    } else {
      // VI chỉ cập nhật VI, không ảnh hưởng EN
      setContent((p) => ({ ...p, vi: value }));
    }
  };

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
      const payload: Blog = {
        name,
        slug,
        short_des: { en: shortDes.en || "", vi: shortDes.vi || "" },
        content,
        category: Number(category),
      };
      const created = await createBlog(payload);
      toast.success("ĐÃ TẠO BÀI VIẾT THÀNH CÔNG", {
        description: <strong>{name.vi || name.en}</strong>,
      });
      onAdd(created);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      toast.error("Thêm bài viết thất bại", { description: message });
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
            Thêm bài viết (Knowledge Center)
          </h2>
          <button
            className="absolute top-6 right-6 text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="add-blog-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-6"
        >
          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Title (EN)"
              value={name.en || ""}
              onChange={(v) => handleNameChange("en", v)}
            />
            <Input
              label="Tiêu đề (VI)"
              value={name.vi || ""}
              onChange={(v) => handleNameChange("vi", v)}
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

          {/* Short description (EN/VI) */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Short description (EN)"
              value={shortDes.en || ""}
              onChange={(v) => setShortDes((p) => ({ ...p, en: v }))}
            />
            <Input
              label="Mô tả ngắn (VI)"
              value={shortDes.vi || ""}
              onChange={(v) => setShortDes((p) => ({ ...p, vi: v }))}
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
                  {c.name?.vi ? `${c.name.vi} (${c.name.en})` : c.name.en}
                </option>
              ))}
            </select>
          </div>

          {/* Content (EN drives VI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-white">Content (EN)</label>
              <Editor
                initialContent={content.en || ""}
                onContentChange={(v) => handleContentChange("en", v)}
                folder="blog"
              />
            </div>
            <div>
              <label className="block mb-1 text-white">Nội dung (VI)</label>
              <Editor
                key={viKey} // remount khi bị mirror từ EN
                initialContent={content.vi || ""}
                onContentChange={(v) => handleContentChange("vi", v)}
                folder="blog"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c11] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="add-blog-form"
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
              "Thêm bài viết"
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
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
