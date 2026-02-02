// src/services/HomeService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Home {
  id?: number; // int8 (bigint)
  content?: I18N | null; // jsonb
  created_at?: string;
}

/* =======================
   HOME CRUD
======================= */

export async function createHome(payload: Home) {
  const { data, error } = await supabase
    .from("home")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data as Home;
}

export async function updateHome(id: number, payload: Partial<Home>) {
  const { data, error } = await supabase
    .from("home")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Home;
}

export async function deleteHome(id: number) {
  const { error } = await supabase.from("home").delete().eq("id", id);
  if (error) throw error;
}

export async function getHomeById(id: number) {
  const { data, error } = await supabase
    .from("home")
    .select(
      `
        id,
        content,
        created_at
      `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Home;
}

export async function getAllHomes({
  page = 1,
  limit = 10,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("home").select(
    `
      id,
      content,
      created_at
    `,
    { count: "exact" },
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [`content->>vi.ilike.${like}`, `content->>en.ilike.${like}`].join(","),
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as Home[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
