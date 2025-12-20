"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ContactAdd from "@/components/contact/ContactAdd";
import ContactUpdate from "@/components/contact/ContactUpdate";
import {
  getAllContacts,
  deleteContact,
  type Contact,
} from "@/services/ContactService";

const t = (i18n?: { vi?: string; en?: string }, locale: "vi" | "en" = "vi") =>
  (i18n?.[locale] ?? i18n?.en ?? i18n?.vi ?? "").trim();

export default function ContactTable() {
  const [items, setItems] = useState<Contact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await getAllContacts({
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
      toast.error("Không tải được danh sách contact");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (c: Contact) => {
    const confirmed = window.confirm("Xoá liên kết này?");
    if (!confirmed) return;

    try {
      await deleteContact(c.id);
      toast.success("Xoá thành công");
      fetchItems();
    } catch (err: any) {
      toast.error("Xoá thất bại", { description: err?.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý Contact{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalItems})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl"
        >
          <Plus className="w-4 h-4" /> Thêm liên kết
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
          placeholder="Tìm theo văn phòng hoặc người liên hệ..."
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[360px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Văn phòng</th>
              <th className="px-4 py-2">Người liên hệ</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Không có liên kết contact nào
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr
                  key={c.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[300px] truncate">
                    {c.office ? t(c.office.title) : `#${c.id_office}`}
                  </td>
                  <td className="px-4 py-3 max-w-[300px] truncate">
                    {c.people
                      ? `${t(c.people.name)} — ${t(c.people.position)}`
                      : `#${c.id_people}`}
                  </td>
                  <td className="px-4 py-3">{c.people?.email || "-"}</td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setSelected(c)}
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
      </div>

      {showAddModal && (
        <ContactAdd
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            fetchItems();
          }}
        />
      )}

      {selected && (
        <ContactUpdate
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            setSelected(null);
            fetchItems();
          }}
        />
      )}

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
