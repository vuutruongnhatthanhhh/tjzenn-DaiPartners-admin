// components/blog/BlogTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import BlogAdd from "@/components/blog/BlogAdd";
import BlogUpdate from "@/components/blog/BlogUpdate";

import {
  getAllBlogs,
  deleteBlog,
  type Blog,
  type I18N,
} from "@/services/BlogService";
import { getAllCategories, type Category } from "@/services/CategoryService";

// helper lấy chuỗi theo locale
const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function BlogTable() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  // pagination & filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // categories for filter & display
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");

  const catMap = useMemo(() => {
    const m = new Map<number, Category>();
    categories.forEach((c) => c.id && m.set(c.id, c));
    return m;
  }, [categories]);

  // fetch categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories({ page: 1, limit: 200, search: "" });
        setCategories(res.data);
      } catch (e) {
        toast.error("Không tải được danh mục");
      }
    })();
  }, []);

  // fetch blogs
  const fetchBlogs = async () => {
    try {
      const res = await getAllBlogs({
        page,
        limit: 10,
        search: debouncedSearch,
        categoryId: categoryId === "" ? undefined : Number(categoryId),
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setBlogs(res.data);
      setTotalPages(res.totalPages);
      setTotalBlogs(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch blog:", err);
      toast.error("Không tải được danh sách bài viết");
    }
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, categoryId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (b: Blog) => {
    const confirmed = window.confirm(`Xoá bài viết "${t(b.name)}"?`);
    if (!confirmed) return;
    try {
      await deleteBlog(b.id as number);
      toast.success("Xoá bài viết thành công");
      fetchBlogs();
    } catch (err: any) {
      toast.error("Xoá thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    }
  };

  const formatDate = (s?: string) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý bài viết{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalBlogs})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm bài viết
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo tiêu đề (EN/VI)"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />

        <select
          value={categoryId === "" ? "" : String(categoryId)}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value ? Number(e.target.value) : "");
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Danh mục</th>
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Không tìm thấy bài viết nào
                </td>
              </tr>
            ) : (
              blogs.map((b) => {
                const cat = b.category ? catMap.get(b.category) : undefined;
                return (
                  <tr
                    key={b.id}
                    className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                  >
                    <td className="px-4 py-3 rounded-l-xl max-w-[360px] truncate">
                      {t(b.name)}
                    </td>
                    <td className="px-4 py-3">
                      {cat ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap bg-blue-500/20 text-blue-300">
                          {t(cat.name)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(b.created_at)}</td>
                    <td className="px-4 py-3 text-right rounded-r-xl">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedBlog(b)}
                          className="hover:text-yellow-400"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          className="hover:text-red-500"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Add Modal */}
        {showAddModal && (
          <BlogAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchBlogs();
            }}
          />
        )}

        {/* Update Modal */}
        {selectedBlog && (
          <BlogUpdate
            blog={selectedBlog}
            onClose={() => setSelectedBlog(null)}
            onUpdate={() => {
              setSelectedBlog(null);
              fetchBlogs();
            }}
          />
        )}
      </div>

      {/* Pagination */}
      {blogs.length > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="px-3 py-1 text-sm">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
