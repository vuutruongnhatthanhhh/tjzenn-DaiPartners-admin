import { checkAdmin, checkModOrAdmin } from "@/lib/checkRole";
import { supabase } from "@/lib/supabaseClient";

export interface Blog {
  title: string;
  url: string;
  image: string;
  shortDescription: string;
  content: string;
  author: number; // userId
  isHide: boolean;
  category: string;
}

export async function createBlog(form: Blog) {
  await checkModOrAdmin();
  const { data, error } = await supabase
    .from("blogs")
    .insert([{ ...form }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export const getAllBlogs = async ({
  page = 1,
  limit = 10,
  search = "",
  category = "",
  isHide = null,
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isHide?: boolean | null;
}) => {
  await checkModOrAdmin();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("blogs")
    .select(
      "id, title, url, image, shortDescription, content, author(id,name), category, isHide, created_at",
      { count: "exact" }
    );

  // Search
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Filter
  if (category) {
    query = query.eq("category", category);
  }

  // Filter
  if (isHide !== null) {
    query = query.eq("isHide", isHide);
  }

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

export async function updateBlog(id: number, form: Partial<Blog>) {
  await checkAdmin();
  const { data, error } = await supabase
    .from("blogs")
    .update({ ...form })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteBlog(id: number) {
  await checkAdmin();
  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) throw error;
}
