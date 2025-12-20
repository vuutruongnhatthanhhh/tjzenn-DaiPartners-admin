"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import CareerContentAdd from "@/components/career/CareerContentAdd";
import CareerContentUpdate from "@/components/career/CareerContentUpdate";
import {
  getAllCareerContents,
  deleteCareerContent,
  type CareerContent,
} from "@/services/CareerContentService";

export default function CareerContentTable() {
  const [items, setItems] = useState<CareerContent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<CareerContent | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await getAllCareerContents({
        page,
        limit: 10,
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
      console.error("Lỗi khi fetch career content:", err);
      toast.error("Không tải được danh sách career content");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (c: CareerContent) => {
    const confirmed = window.confirm(`Xoá career content này?`);
    if (!confirmed) return;

    try {
      await deleteCareerContent(c.id as number);
      toast.success("Xoá career content thành công");
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

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Career Content{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>
        {/* <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Career Content
        </button> */}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm trong content hoặc getintouch (EN/VI)"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[320px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              {/* <th className="px-4 py-2">Preview nội dung</th> */}
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-400">
                  Không tìm thấy career content nào
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr
                  key={c.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  {/* <td className="px-4 py-3 rounded-l-xl max-w-[520px] truncate text-gray-300">
                    {c.content?.vi || c.content?.en || "(trống)"}
                  </td> */}
                  <td className="px-4 py-3">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="hover:text-yellow-400"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* <button
                        onClick={() => handleDelete(c)}
                        className="hover:text-red-500"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {showAddModal && (
          <CareerContentAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchItems();
            }}
          />
        )}

        {selected && (
          <CareerContentUpdate
            career={selected}
            onClose={() => setSelected(null)}
            onUpdate={() => {
              setSelected(null);
              fetchItems();
            }}
          />
        )}
      </div>

      {items.length > 0 && totalPages > 1 && (
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
