// NOTE: Đã cập nhật component BlogTable dùng getAllBlogs

"use client";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import OurPeopleAdd from "@/components/our-people/OurPeopleAdd";
import { getAllBlogs, deleteBlog } from "@/services/BlogService";
import BlogUpdate from "@/components/blog/BlogUpdate";

export default function BlogTable() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isHide, setIsHide] = useState("");
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const fetchBlogs = async () => {
    try {
      const res = await getAllBlogs({
        page,
        limit: 10,
        search: debouncedSearch,
        category,
        isHide: isHide === "" ? null : isHide === "true",
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
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, debouncedSearch, category, isHide]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (blog: any) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá "${blog.title}"?`
    );
    if (!confirmed) return;
    try {
      await deleteBlog(blog.id);
      toast.success("Xóa bài viết thành công");
      fetchBlogs();
    } catch (err: any) {
      toast.error("Xóa bài viết thất bại", {
        description: err.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý bài viết
          <span className="text-3xl font-bold text-green-600">
            {" "}
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

      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm tiêu đề"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />

        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Tất cả danh mục</option>
          <option value="KHÁM PHÁ">KHÁM PHÁ</option>
          <option value="BLOCKCHAIN">BLOCKCHAIN</option>
          <option value="WEB & MOBILE">WEB & MOBILE</option>
        </select>

        <select
          value={isHide}
          onChange={(e) => {
            setPage(1);
            setIsHide(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Hiển thị</option>
          <option value="true">Ẩn</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Danh mục</th>
              <th className="px-4 py-2">Hiển thị</th>
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
              blogs.map((blog) => (
                <tr
                  key={blog.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[300px] truncate">
                    {blog.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                        blog.category === "WEB & MOBILE"
                          ? "bg-blue-500/20 text-blue-400"
                          : blog.category === "KHÁM PHÁ"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : blog.category === "BLOCKCHAIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium">
                      {blog.isHide ? (
                        <X className="text-red-500" />
                      ) : (
                        <Check className="text-green-500" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedBlog(blog)}
                        className="hover:text-yellow-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog)}
                        className="hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {showAddModal && (
          <OurPeopleAdd
            onClose={() => setShowAddModal(false)}
            onAdd={fetchBlogs}
          />
        )}
        {selectedBlog && (
          <BlogUpdate
            blog={selectedBlog}
            onClose={() => setSelectedBlog(null)}
            onUpdate={fetchBlogs}
          />
        )}
      </div>

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
