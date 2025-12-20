import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export type AwardItem = {
  year: number;
  description: I18N; // jsonb
  images: string[]; // nhiều hình (text)
};

export interface Award {
  id?: number; // int8 (bigint)
  content: I18N; // jsonb (nội dung riêng)
  items: AwardItem[]; // danh sách giải thưởng
}

/* =======================
   AWARD CRUD
   table: awards
======================= */

export async function createAward(payload: Award) {
  const { data, error } = await supabase
    .from("awards")
    .insert([
      {
        content: payload.content ?? {},
        items: payload.items ?? [],
      },
    ])
    .select("id, content, items")
    .single();

  if (error) throw error;
  return data as Award;
}

export async function updateAward(id: number, payload: Partial<Award>) {
  const { data, error } = await supabase
    .from("awards")
    .update({
      ...(payload.content !== undefined ? { content: payload.content } : {}),
      ...(payload.items !== undefined ? { items: payload.items } : {}),
    })
    .eq("id", id)
    .select("id, content, items")
    .single();

  if (error) throw error;
  return data as Award;
}

export async function deleteAward(id: number) {
  const { error } = await supabase.from("awards").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllAwards({
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

  let query = supabase.from("awards").select(
    `
      id,
      content,
      items
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    // Search giống ProjectService: chỉ search trong content (vi/en)
    query = query.or(
      [`content->>vi.ilike.${like}`, `content->>en.ilike.${like}`].join(",")
    );
  }

  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as Award[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
