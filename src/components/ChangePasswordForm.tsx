"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changeUserPassword } from "@/services/UserService";
import { useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) {
      return toast.error("Không thể xác định tài khoản hiện tại");
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.warning("Vui lòng nhập đầy đủ thông tin");
    }

    if (newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }

    try {
      setLoading(true);

      await changeUserPassword({
        email: userEmail,
        currentPassword,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Đổi mật khẩu thất bại", {
        description: err?.message || "Đã có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto space-y-4 p-6 bg-[#1c1c1e] border border-white/10 rounded-xl"
    >
      <h2 className="text-xl font-semibold text-white">Đổi mật khẩu</h2>

      <Input
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={setCurrentPassword}
        type="password"
      />
      <Input
        label="Mật khẩu mới"
        value={newPassword}
        onChange={setNewPassword}
        type="password"
      />
      <Input
        label="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={setConfirmPassword}
        type="password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg bg-[#168bb9] text-white font-semibold  transition"
      >
        {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
};

function Input({ label, value, onChange, type = "text" }: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <label className="block mb-1 text-white">{label}</label>
      <input
        type={isPassword && !show ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-black text-white border border-gray-600 focus:outline-none pr-12"
        required
      />
      {isPassword && (
        <button
          type="button"
          className="absolute right-3 top-9 text-gray-400 hover:text-white"
          onClick={() => setShow((prev) => !prev)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
