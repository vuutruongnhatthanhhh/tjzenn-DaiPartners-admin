"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import Editor from "@/components/editor/Editor";
import { updateBlog } from "@/services/BlogService";
import CategoryBlogSelect from "@/components/blog/CategoryBlogSelect";
import { supabase } from "@/lib/supabaseClient";
import ImageBox from "@/components/image/ImageBox";
import { slugify } from "@/utils/slugify";

interface BlogUpdateProps {
  blog: any;
  onClose: () => void;
  onUpdate: (updatedBlog: any) => void;
}

export default function BlogUpdate({
  blog,
  onClose,
  onUpdate,
}: BlogUpdateProps) {
  const [form, setForm] = useState({
    title: blog.title,
    url: blog.url,
    image: blog.image,
    shortDescription: blog.shortDescription,
    content: blog.content,
    author: blog.author?.id ?? "",
    category: blog.category,
    isHide: blog.isHide,
  });

  const [authors, setAuthors] = useState<{ id: number; name: string }[]>([]);
  const [showImagePopup, setShowImagePopup] = useState(false);

  useEffect(() => {
    const fetchAuthors = async () => {
      const { data, error } = await supabase.from("users").select("id, name");
      if (!error && data) setAuthors(data);
    };
    fetchAuthors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!form.image) return toast.warning("Vui lòng chọn ảnh bài viết");
      const updated = await updateBlog(blog.id, form);
      toast.success("Cập nhật bài viết thành công");
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      const message =
        err?.message || err?.error?.message || JSON.stringify(err);
      if (
        message.includes("duplicate key") &&
        message.includes("blogs_url_key")
      ) {
        toast.error("URL bài viết đã tồn tại. Vui lòng chọn URL khác.");
      } else {
        toast.error("Cập nhật thất bại", {
          description: message,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Cập nhật bài viết</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="update-blog-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-4"
        >
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(v) =>
              setForm({
                ...form,
                title: v,
              })
            }
          />
          <Input
            label="URL"
            value={form.url}
            onChange={(v) => setForm({ ...form, url: v })}
          />

          <div>
            <label className="block mb-1 text-white">
              Ảnh bài viết <span className="text-red-500">(1536 x 1024)</span>
            </label>
            {form.image && (
              <div className="relative w-32 h-32 mb-2">
                <img
                  src={form.image}
                  alt={form.title}
                  className="w-full h-full object-cover rounded border border-gray-700"
                />
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-xs"
                  onClick={() => setForm({ ...form, image: "" })}
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
          <Input
            label="Mô tả ngắn"
            value={form.shortDescription}
            onChange={(v) => setForm({ ...form, shortDescription: v })}
          />
          <CategoryBlogSelect
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
          />

          <div>
            <label className="block mb-1 text-white">Tác giả</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.author || ""}
              onChange={(e) =>
                setForm({ ...form, author: parseInt(e.target.value) })
              }
              required
            >
              <option value="" disabled>
                -- Chọn tác giả --
              </option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-white">Trạng thái</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.isHide ? "true" : "false"}
              onChange={(e) =>
                setForm({ ...form, isHide: e.target.value === "true" })
              }
            >
              <option value="false">Hiển thị</option>
              <option value="true">Ẩn</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-white">
              Nội dung <span className="text-red-500">(Ảnh 1536 x 1024)</span>
            </label>
            <Editor
              initialContent={form.content}
              onContentChange={(content) => setForm({ ...form, content })}
              folder="blog"
            />
          </div>
        </form>

        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-blog-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Cập nhật bài viết
          </button>
        </div>
      </div>
      {showImagePopup && (
        <ImageBox
          open={showImagePopup}
          onClose={() => setShowImagePopup(false)}
          folder="blog"
          handleImageSelect={(url) => {
            setForm({ ...form, image: url });
            setShowImagePopup(false);
          }}
        />
      )}
    </div>
  );
}

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
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
