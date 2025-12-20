"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import AwardAdd from "@/components/awards/AwardAdd";
import AwardUpdate from "@/components/awards/AwardUpdate";
import {
  getAllAwards,
  deleteAward,
  type Award,
  type I18N,
} from "@/services/AwardService";

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function AwardTable() {
  const [items, setItems] = useState<Award[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Award | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await getAllAwards({
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
      console.error("Lỗi khi fetch awards:", err);
      toast.error("Không tải được danh sách awards");
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

  const handleDelete = async (a: Award) => {
    const confirmed = window.confirm(
      `Xoá awards "${t(a.content) || `#${a.id}`}"?`
    );
    if (!confirmed) return;

    try {
      await deleteAward(a.id as number);
      toast.success("Xoá awards thành công");
      fetchItems();
    } catch (err: any) {
      toast.error("Xoá thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    }
  };

  const getItemsCount = (a: Award) =>
    Array.isArray(a.items) ? a.items.length : 0;

  const getImagesCount = (a: Award) => {
    if (!Array.isArray(a.items)) return 0;
    return a.items.reduce(
      (sum, it: any) =>
        sum + (Array.isArray(it?.images) ? it.images.length : 0),
      0
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Awards{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>

        {/* <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm awards
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
          placeholder="Tìm theo content (EN/VI)"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[320px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              {/* <th className="px-4 py-2">Content</th> */}
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Images</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Không tìm thấy awards nào
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr
                  key={a.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  {/* <td className="px-4 py-3 rounded-l-xl max-w-[520px] truncate">
                    {t(a.content) || (
                      <span className="text-gray-400">#{a.id}</span>
                    )}
                  </td> */}

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-200">
                      {getItemsCount(a)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-200">
                      {getImagesCount(a)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(a)}
                        className="hover:text-yellow-400"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* <button
                        onClick={() => handleDelete(a)}
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
          <AwardAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchItems();
            }}
          />
        )}

        {selected && (
          <AwardUpdate
            award={selected}
            onClose={() => setSelected(null)}
            onUpdate={() => {
              setSelected(null);
              fetchItems();
            }}
          />
        )}
      </div>

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
