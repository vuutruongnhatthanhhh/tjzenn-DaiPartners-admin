"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import PracticeChildAdd from "@/components/practice-child/PracticeChildAdd";
import PracticeChildUpdate from "@/components/practice-child/PracticeChildUpdate";

import {
  getAllPracticeChildren,
  deletePracticeChild,
  type PracticeChild,
  type I18N,
} from "@/services/PracticeChildService";
import { getAllPractices, type Practice } from "@/services/PracticeService";

// helper lấy chuỗi theo locale
const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function PracticeChildTable() {
  const [items, setItems] = useState<PracticeChild[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<PracticeChild | null>(null);

  // pagination & filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterParent, setFilterParent] = useState<number | undefined>(
    undefined,
  );

  const [practices, setPractices] = useState<Practice[]>([]);

  // Load practices for filter
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllPractices({ page: 1, limit: 200, search: "" });
        setPractices(res.data ?? []);
      } catch {
        toast.error("Không tải được danh sách practices");
      }
    })();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getAllPracticeChildren({
        page,
        limit: 10,
        search: debouncedSearch,
        parentId: filterParent,
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setItems(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch practice children:", err);
      toast.error("Không tải được danh sách practice child");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, filterParent]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (p: PracticeChild) => {
    const confirmed = window.confirm(`Xoá practice child "${t(p.title)}"?`);
    if (!confirmed) return;

    try {
      await deletePracticeChild(p.id as number);
      toast.success("Xoá practice child thành công");
      fetchItems();
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

  const getParentTitle = (parentId?: number | null) => {
    if (!parentId) return "-";
    const parent = practices.find((p) => p.id === parentId);
    return parent ? t(parent.title) : `#${parentId}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Practice Children{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm practice child
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
          placeholder="Tìm theo title (EN/VI) hoặc URL"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[320px]"
        />

        <select
          value={filterParent ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilterParent(
              e.target.value ? Number(e.target.value) : undefined,
            );
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600"
        >
          <option value="">-- Tất cả parent --</option>
          {practices.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {t(pr.title)}
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
              <th className="px-4 py-2">URL</th>
              <th className="px-4 py-2">Practice cha</th>
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Không tìm thấy practice child nào
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr
                  key={p.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[360px] truncate">
                    {t(p.title)}
                  </td>
                  <td className="px-4 py-3 max-w-[280px] truncate opacity-90">
                    {p.url || "-"}
                  </td>
                  <td className="px-4 py-3 max-w-[240px] truncate">
                    {getParentTitle(p.parent)}
                  </td>
                  <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(p)}
                        className="hover:text-yellow-400"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
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
          <PracticeChildAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchItems();
            }}
          />
        )}

        {/* Update Modal */}
        {selected && (
          <PracticeChildUpdate
            child={selected}
            onClose={() => setSelected(null)}
            onUpdate={() => {
              setSelected(null);
              fetchItems();
            }}
          />
        )}
      </div>

      {/* Pagination */}
      {items.length > 0 && (
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
