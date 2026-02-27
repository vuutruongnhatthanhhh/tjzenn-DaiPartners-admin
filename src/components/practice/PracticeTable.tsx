// src/components/practice/PracticeTable.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Plus, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import PracticeAdd from "@/components/practice/PracticeAdd";
import PracticeUpdate from "@/components/practice/PracticeUpdate";

import {
  getAllPractices,
  deletePractice,
  updatePractice,
  type Practice,
  type I18N,
} from "@/services/PracticeService";

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function PracticeTable() {
  const [items, setItems] = useState<Practice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Practice | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const [draggingOver, setDraggingOver] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await getAllPractices({
        page,
        limit: 100,
        search: debouncedSearch,
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setItems(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch practices:", err);
      toast.error("Không tải được danh sách practice");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (p: Practice) => {
    const confirmed = window.confirm(`Xoá practice "${t(p.title)}"?`);
    if (!confirmed) return;

    try {
      await deletePractice(p.id as number);
      toast.success("Xoá practice thành công");
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
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  /* ── Drag & drop handlers ── */

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggingOver(index);
  };

  const handleDrop = async (dropIndex: number) => {
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDraggingOver(null);
      dragIndex.current = null;
      return;
    }

    // Reorder locally
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Assign position by new order (1-based, offset by page)
    const pageOffset = (page - 1) * 10;
    const withPosition = reordered.map((item, idx) => ({
      ...item,
      position: pageOffset + idx + 1,
    }));

    setItems(withPosition);
    setDraggingOver(null);
    dragIndex.current = null;

    // Persist to DB
    try {
      setIsSavingOrder(true);
      await Promise.all(
        withPosition.map((item) =>
          updatePractice(item.id as number, { position: item.position }),
        ),
      );
      toast.success("Đã lưu thứ tự");
    } catch (err: any) {
      toast.error("Lưu thứ tự thất bại", { description: err?.message });
      fetchItems(); // rollback
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggingOver(null);
    dragIndex.current = null;
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Practices{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm practice
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
        {isSavingOrder && (
          <span className="text-sm text-gray-400 animate-pulse">
            Đang lưu thứ tự…
          </span>
        )}
      </div>

      {/* Drag hint */}
      {!debouncedSearch && items.length > 1 && (
        <p className="text-xs text-gray-500">
          Kéo <GripVertical className="inline w-3 h-3" /> để sắp xếp thứ tự hiển
          thị
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-2 py-2 w-8" /> {/* grip */}
              <th className="px-4 py-2 w-12 text-gray-400 text-sm">#</th>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">URL / Link</th>
              <th className="px-4 py-2 w-28 text-center">Loại</th>
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  Không tìm thấy practice nào
                </td>
              </tr>
            ) : (
              items.map((p, idx) => (
                <tr
                  key={p.id}
                  draggable={!debouncedSearch}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={`bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl transition-colors ${
                    draggingOver === idx
                      ? "ring-2 ring-blue-500 ring-inset opacity-70"
                      : ""
                  } ${dragIndex.current === idx ? "opacity-40" : ""}`}
                >
                  {/* Grip */}
                  <td className="px-2 py-3 rounded-l-xl">
                    {!debouncedSearch && (
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                    )}
                  </td>

                  {/* Position */}
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {p.position ?? "-"}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 max-w-[300px] truncate">
                    {t(p.title)}
                  </td>

                  {/* URL / href */}
                  <td className="px-4 py-3 max-w-[260px] truncate opacity-90 text-sm">
                    {p.external && p.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.href}</span>
                      </a>
                    ) : (
                      <span className="text-gray-300">{p.url || "-"}</span>
                    )}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3 text-center">
                    {p.external ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-medium border border-blue-700/50">
                        <ExternalLink className="w-3 h-3" />
                        External
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 text-xs font-medium border border-green-700/50">
                        Internal
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm">
                    {formatDate(p.created_at)}
                  </td>

                  {/* Actions */}
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

        {showAddModal && (
          <PracticeAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchItems();
            }}
          />
        )}

        {selected && (
          <PracticeUpdate
            practice={selected}
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
