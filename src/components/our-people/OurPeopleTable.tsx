// components/our-people/OurPeopleTable.tsx
"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import OurPeopleAdd from "@/components/our-people/OurPeopleAdd";
import OurPeopleUpdate from "@/components/our-people/OurPeopleUpdate";
import {
  getAllPeople,
  deletePerson,
  OurPeople,
} from "@/services/OurPeopleService";

// helper lấy chuỗi theo locale
const t = (i18n?: { vi?: string; en?: string }, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function OurPeopleTable() {
  const [people, setPeople] = useState<OurPeople[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<OurPeople | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchPeople = async () => {
    try {
      const res = await getAllPeople({
        page,
        limit: 10,
        search: debouncedSearch,
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setPeople(res.data);
      setTotalPages(res.totalPages);
      setTotalPeople(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch our_people:", err);
    }
  };

  useEffect(() => {
    fetchPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (p: OurPeople) => {
    const confirmed = window.confirm(`Xoá "${t(p.name)}" ?`);
    if (!confirmed) return;
    try {
      await deletePerson(p.id as string);
      toast.success("Xoá nhân sự thành công");
      fetchPeople();
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
          Our People
          <span className="text-3xl font-bold text-green-600">
            {" "}
            ({totalPeople})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm nhân sự
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
          placeholder="Tìm tên hoặc email"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Avatar</th>
              <th className="px-4 py-2">Họ tên</th>
              <th className="px-4 py-2">Chức danh</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Không có nhân sự nào
                </td>
              </tr>
            ) : (
              people.map((p) => (
                <tr
                  key={p.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 rounded-l-xl">
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt={t(p.name)}
                        className="w-10 h-10 rounded object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[260px] truncate">
                    {t(p.name)}
                  </td>
                  <td className="px-4 py-3 max-w-[260px] truncate">
                    {t(p.position)}
                  </td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedPerson(p)}
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
          <OurPeopleAdd
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              setShowAddModal(false);
              fetchPeople();
            }}
          />
        )}

        {/* Update Modal */}
        {selectedPerson && (
          <OurPeopleUpdate
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
            onUpdate={() => {
              setSelectedPerson(null);
              fetchPeople();
            }}
          />
        )}
      </div>

      {people.length > 0 && (
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
