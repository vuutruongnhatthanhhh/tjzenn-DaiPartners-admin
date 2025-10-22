// services/CategoryService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Category {
  id?: number; // int8
  name: I18N; // jsonb { vi, en }
  created_at?: string; // timestamp
}

/** Create */
export async function createCategory(payload: Category) {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

/** List + paginate + search (chỉ theo name vi/en) */
export async function getAllCategories({
  page = 1,
  limit = 10,
  search = "",
  ascending = false, // sort theo created_at
}: {
  page?: number;
  limit?: number;
  search?: string;
  ascending?: boolean;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("categories").select(
    `
      id,
      name,
      created_at
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [`name->>vi.ilike.${like}`, `name->>en.ilike.${like}`].join(",")
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Category[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

/** Detail */
export async function getCategoryById(id: number) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Category;
}

/** Update (partial) */
export async function updateCategory(id: number, payload: Partial<Category>) {
  const { data, error } = await supabase
    .from("categories")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

/** Delete */
export async function deleteCategory(id: number) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
