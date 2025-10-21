// components/careers/CareerTable.tsx
"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

// --- đổi sang career ---
import CareerAdd from "@/components/career/CareerAdd";
import CareerUpdate from "@/components/career/CareerUpdate";
import {
  getAllCareers,
  deleteCareer,
  type Career,
  type I18N,
} from "@/services/CareerService";

// helper lấy chuỗi theo locale
const t = (i18n?: I18N, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function CareerTable() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCareers, setTotalCareers] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchCareers = async () => {
    try {
      const res = await getAllCareers({
        page,
        limit: 20,
        search: debouncedSearch, // service chỉ lọc theo name
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setCareers(res.data);
      setTotalPages(res.totalPages);
      setTotalCareers(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch careers:", err);
    }
  };

  useEffect(() => {
    fetchCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (c: Career) => {
    const confirmed = window.confirm(`Xoá tin tuyển dụng "${t(c.name)}" ?`);
    if (!confirmed) return;
    try {
      await deleteCareer(c.id as number);
      toast.success("Xoá tin tuyển dụng thành công");
      fetchCareers();
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
          Careers
          <span className="text-3xl font-bold text-green-600">
            {" "}
            ({totalCareers})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm tin tuyển dụng
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
          placeholder="Tìm theo tên vị trí (EN/VI)"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Vị trí</th>
              <th className="px-4 py-2">Địa điểm</th>
              <th className="px-4 py-2">Mức lương</th>
              <th className="px-4 py-2">Hình thức</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {careers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Chưa có tin tuyển dụng
                </td>
              </tr>
            ) : (
              careers.map((c) => (
                <tr
                  key={c.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 max-w-[260px] truncate">
                    {t(c.name)}
                  </td>
                  <td className="px-4 py-3 max-w-[220px] truncate">
                    {t(c.location)}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate">
                    {t(c.salary)}
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate">
                    {t(c.type)}
                  </td>
                  <td className="px-4 py-3">{c.email || "-"}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedCareer(c)}
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
          <CareerAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchCareers();
            }}
          />
        )}

        {/* Update Modal */}
        {selectedCareer && (
          <CareerUpdate
            career={selectedCareer}
            onClose={() => setSelectedCareer(null)}
            onUpdate={() => {
              setSelectedCareer(null);
              fetchCareers();
            }}
          />
        )}
      </div>

      {careers.length > 0 && (
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
