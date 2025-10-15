"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createUser } from "@/services/UserService";

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: {
    name: string;
    email: string;
    role: string;
    password: string;
  }) => void;
}

export default function UserAdd({ onClose, onAdd }: AddUserModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "MOD",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await createUser(form);

      toast.success("TẠO MỚI THÀNH CÔNG", {
        description: (
          <>
            <strong>{form.name}</strong> đã được thêm vào hệ thống.
          </>
        ),
      });

      onAdd(newUser);
      onClose();
    } catch (err: any) {
      toast.error("TẠO MỚI THẤT BẠI", {
        description: err.message || "Lỗi không xác định",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md h-[90vh] relative flex flex-col">
        {/* Header form */}
        <div className="sticky top-0 z-10 bg-[#1c1c1e] p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Thêm người dùng</h2>
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="add-user-form"
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
            <label className="block mb-1 text-white">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
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
            form="add-user-form"
            className="w-full py-2 rounded-lg bg-buttonRoot text-white font-semibold"
          >
            Thêm người dùng
          </button>
        </div>
      </div>
    </div>
  );
}
