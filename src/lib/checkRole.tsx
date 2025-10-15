import { getSession } from "next-auth/react"; // vẫn dùng client hoặc server đều được

export const checkAdmin = async () => {
  const session = await getSession();
  const role = session?.user?.role;

  if (!role || role !== "ADMIN") {
    throw new Error("Bạn không có quyền thực hiện");
  }

  return session;
};

export const checkModOrAdmin = async () => {
  const session = await getSession();
  const role = session?.user?.role;

  if (!role || (role !== "ADMIN" && role !== "MOD")) {
    throw new Error("Bạn không có quyền thực hiện");
  }

  return session;
};
