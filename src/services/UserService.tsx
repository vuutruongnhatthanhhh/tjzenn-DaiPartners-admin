import { checkAdmin, checkModOrAdmin } from "@/lib/checkRole";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { getSession } from "next-auth/react";

export interface UserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const createUser = async (form: UserPayload) => {
  await checkAdmin();
  // check email
  const { data: existingUsers, error: checkError } = await supabase
    .from("users")
    .select("id")
    .eq("email", form.email);

  if (checkError) {
    throw new Error("Lỗi khi kiểm tra email");
  }

  if (existingUsers && existingUsers.length > 0) {
    throw new Error("Email đã được sử dụng");
  }

  const hashedPassword = await bcrypt.hash(form.password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name: form.name,
        email: form.email,
        password: hashedPassword,
        role: form.role,
      },
    ])
    .select();

  if (error || !data || data.length === 0) {
    throw new Error(error?.message || "Không thể thêm người dùng");
  }

  return {
    id: data[0].id,
    name: form.name,
    email: form.email,
    role: form.role,
    password: hashedPassword,
  };
};

export const getAllUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  await checkModOrAdmin();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("users")
    .select("id, name, email, role, created_at", { count: "exact" });

  // search
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  //   filter
  if (role) {
    query = query.eq("role", role);
  }

  //   pagination
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
};

export const updateUser = async (form: UpdateUserPayload) => {
  await checkAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      name: form.name,
      email: form.email,
      role: form.role,
    })
    .eq("id", form.id);

  if (error) {
    throw new Error(error.message);
  }

  return form;
};

export const deleteUser = async (id: number) => {
  await checkAdmin();
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

export const changeUserPassword = async ({
  email,
  currentPassword,
  newPassword,
}: {
  email: string;
  currentPassword: string;
  newPassword: string;
}) => {
  // 1. find user by email
  const { data: users, error } = await supabase
    .from("users")
    .select("id, password")
    .eq("email", email)
    .limit(1);

  if (error) {
    throw new Error("Lỗi khi truy vấn người dùng");
  }

  const user = users?.[0];
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  // 2. compare password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Mật khẩu hiện tại không đúng");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // 3. update password
  const { error: updateError } = await supabase
    .from("users")
    .update({ password: hashedNewPassword })
    .eq("id", user.id);

  if (updateError) {
    throw new Error("Không thể cập nhật mật khẩu");
  }

  return true;
};
