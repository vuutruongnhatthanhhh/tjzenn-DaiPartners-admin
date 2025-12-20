"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import OfficeAdd from "@/components/office/OfficeAdd";
import OfficeUpdate from "@/components/office/OfficeUpdate";
import {
  getAllOffices,
  deleteOffice,
  type Office,
  type I18N,
} from "@/services/OfficeService";

const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function OfficeTable() {
  const [items, setItems] = useState<Office[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Office | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = async () => {
    try {
      const res = await getAllOffices({ page, limit: 10 });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setItems(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch offices:", err);
      toast.error("Không tải được danh sách office");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (o: Office) => {
    const name = t(o.title) || t(o.address) || `#${o.id}`;
    const confirmed = window.confirm(`Xoá office "${name}"?`);
    if (!confirmed) return;

    try {
      await deleteOffice(o.id as number);
      toast.success("Xoá office thành công");
      fetchItems();
    } catch (err: any) {
      toast.error("Xoá thất bại", {
        description: err?.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Offices{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm office
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Địa chỉ</th>
              <th className="px-4 py-2">Điện thoại</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">MST</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Chưa có office nào
                </td>
              </tr>
            ) : (
              items.map((o) => (
                <tr
                  key={o.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[220px] truncate">
                    {t(o.title) || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-[360px] truncate">
                    {t(o.address) || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-[160px] truncate">
                    {o.phone || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-[220px] truncate">
                    {o.email || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-[160px] truncate">
                    {o.tax_code || "-"}
                  </td>

                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(o)}
                        className="hover:text-yellow-400"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(o)}
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
          <OfficeAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchItems();
            }}
          />
        )}

        {selected && (
          <OfficeUpdate
            office={selected}
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
