"use client";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import UserAdd from "@/components/user/UserAdd";
import UserUpdate from "@/components/user/UserUpdate";
import { getAllUsers } from "@/services/UserService";
import { deleteUser } from "@/services/UserService";
import { toast } from "sonner";

export default function UserTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers({
        page,
        limit: 10,
        search: debouncedSearch,
        role,
      });

      if (res.data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setUsers(res.data);
      setTotalPages(res.totalPages);
      setTotalUsers(res.total);
    } catch (err) {
      console.error("Lỗi khi fetch:", err);
    }
  };

  useEffect(() => {
    if (showAddModal || selectedUser) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showAddModal, selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, role]);

  // debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (userId: number) => {
    const userToDelete = users.find((user) => user.id === userId);
    if (!userToDelete) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa người dùng "${userToDelete.name}"?`
    );

    if (confirmed) {
      try {
        await deleteUser(userId);

        await fetchUsers();

        toast.success("XÓA THÀNH CÔNG", {
          description: (
            <>
              <strong>{userToDelete.name}</strong> đã bị xoá khỏi hệ thống.
            </>
          ),
        });
      } catch (error: any) {
        toast.error("XÓA THẤT BẠI", {
          description: error.message,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Quản lý người dùng{" "}
          <span className="text-3xl font-bold text-green-600">
            ({totalUsers})
          </span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-buttonRoot rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm người dùng
        </button>
      </div>

      {/* search */}
      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm tên/email"
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[300px] sm:w-[300px]"
        />

        {/* filter */}
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="px-3 py-2 rounded-lg bg-black text-white border border-gray-600 w-[140px] sm:w-[160px]"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MOD">MOD</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2">Tên</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Vai trò</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="bg-[#1c1c1e] hover:bg-[#2a2a2e] rounded-xl transition"
                >
                  <td className="px-4 py-3 rounded-l-xl max-w-[160px] whitespace-nowrap truncate">
                    {user.name}
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap max-w-[120px] truncate text-center px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                      title={user.role}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="hover:text-yellow-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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
          <UserAdd onClose={() => setShowAddModal(false)} onAdd={fetchUsers} />
        )}
        {selectedUser && (
          <UserUpdate
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={(updatedUser) =>
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === updatedUser.id ? { ...u, ...updatedUser } : u
                )
              )
            }
          />
        )}
      </div>

      {users.length > 0 && (
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
