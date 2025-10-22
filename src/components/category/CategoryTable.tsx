// components/categories/CategoryTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

// Modals
import CategoryAdd from "@/components/category/CategoryAdd";
import CategoryUpdate from "@/components/category/CategoryUpdate";

// Service
import {
  getAllCategories,
  deleteCategory,
  type Category,
  type I18N,
} from "@/services/CategoryService";

// helper lấy chuỗi theo locale
const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // fetch list
  const fetchCategories = async () => {
    try {
      const res = await getAllCategories({
        page,
        limit: 20,
        search: debouncedSearch, // service chỉ lọc theo name (vi/en)
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setCategories(res.data);
      setTotalPages(res.totalPages);
      setTotalCategories(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch categories:", err);
      toast.error("Không tải được danh mục");
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (c: Category) => {
    const confirmed = window.confirm(`Xoá danh mục "${t(c.name)}" ?`);
    if (!confirmed) return;
    try {
      await deleteCategory(c.id as number);
      toast.success("Xoá danh mục thành công");
      fetchCategories();
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
          Categories{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalCategories})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm danh mục
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
          placeholder="Tìm theo tên danh mục (EN/VI)"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tên danh mục</th>
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-400">
                  Chưa có danh mục
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr
                  key={c.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 max-w-[360px] truncate">
                    {t(c.name)}
                  </td>
                  <td className="px-4 py-3">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedCategory(c)}
                        className="hover:text-yellow-400"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="hover:text-red-500"
                        title="Xoá"
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

        {/* Add Modal */}
        {showAddModal && (
          <CategoryAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchCategories();
            }}
          />
        )}

        {/* Update Modal */}
        {selectedCategory && (
          <CategoryUpdate
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onUpdate={() => {
              setSelectedCategory(null);
              fetchCategories();
            }}
          />
        )}
      </div>

      {categories.length > 0 && (
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
