"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateUser } from "@/services/UserService";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
}

interface UserUpdateProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export default function UserUpdate({
  user,
  onClose,
  onUpdate,
}: UserUpdateProps) {
  const [form, setForm] = useState({ ...user });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updatedUser = await updateUser({
        id: form.id,
        name: form.name,
        email: form.email,
        role: form.role,
      });

      toast.success("CẬP NHẬT THÀNH CÔNG", {
        description: (
          <>
            <strong>{form.name}</strong> đã được cập nhật thông tin
          </>
        ),
      });

      onUpdate(updatedUser);
      onClose();
    } catch (error: any) {
      toast.error("CẬP NHẬT THẤT BẠI", {
        description: error.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        {/* Header form */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Chỉnh sửa người dùng
          </h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="update-user-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-auto px-6 py-4 space-y-4"
        >
          <div>
            <label className="block mb-1 text-white">Họ tên</label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Vai trò</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MOD">MOD</option>
            </select>
          </div>
        </form>

        {/* Footer form */}
        <div className="sticky bottom-0 z-10 bg-[#1c1c1e] px-6 py-4 border-t border-white/10">
          <button
            type="submit"
            form="update-user-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
