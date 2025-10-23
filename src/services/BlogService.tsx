// services/BlogService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Blog {
  id?: number; // int8
  name: I18N; // jsonb
  slug: I18N; // jsonb
  short_des?: I18N; // jsonb  <-- NEW
  content: I18N; // jsonb (HTML/markdown tuỳ anh)
  category?: number | null; // int8 (FK -> categories.id)
  created_at?: string; // timestamp
}

/** Create */
export async function createBlog(payload: Blog) {
  const { data, error } = await supabase
    .from("blogs")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data as Blog;
}

/** List + paginate + search + filter category
 *  - search: CHỈ theo name (vi/en)
 *  - categoryId: nếu truyền vào (number), sẽ .eq("category", categoryId)
 */
export async function getAllBlogs({
  page = 1,
  limit = 10,
  search = "",
  categoryId,
  ascending = false, // sort theo created_at
}: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number | null;
  ascending?: boolean;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("blogs").select(
    `
      id,
      name,
      slug,
      short_des,
      content,
      category,
      created_at
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    // ✅ chỉ search theo name (vi/en)
    query = query.or(
      [`name->>vi.ilike.${like}`, `name->>en.ilike.${like}`].join(",")
    );
  }

  if (typeof categoryId === "number") {
    query = query.eq("category", categoryId);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Blog[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

/** Detail */
export async function getBlogById(id: number) {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Blog;
}

/** Update (partial) */
export async function updateBlog(id: number, payload: Partial<Blog>) {
  const { data, error } = await supabase
    .from("blogs")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Blog;
}

/** Delete */
export async function deleteBlog(id: number) {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
}
