import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface PracticeChild {
  id?: number; // int8
  url?: string | null;
  parent?: number | null; // foreign key to practices
  title: I18N; // jsonb
  content: I18N; // jsonb
  image?: string | null;
  created_at?: string;
}

/* =======================
   PRACTICE CHILD CRUD
======================= */

export async function createPracticeChild(payload: PracticeChild) {
  const { data, error } = await supabase
    .from("practice-child")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) {
    // @ts-ignore
    if (error.code === "23505") {
      throw new Error("URL đã tồn tại, vui lòng chọn URL khác");
    }
    throw error;
  }

  return data as PracticeChild;
}

export async function updatePracticeChild(
  id: number,
  payload: Partial<PracticeChild>,
) {
  const { data, error } = await supabase
    .from("practice-child")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // @ts-ignore
    if (error.code === "23505") {
      throw new Error("URL đã tồn tại, vui lòng chọn URL khác");
    }
    throw error;
  }

  return data as PracticeChild;
}

export async function deletePracticeChild(id: number) {
  const { error } = await supabase.from("practice-child").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllPracticeChildren({
  page = 1,
  limit = 10,
  search = "",
  parentId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: number;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("practice-child").select(
    `
      id,
      url,
      parent,
      title,
      content,
      image,
      created_at
    `,
    { count: "exact" },
  );

  // Filter by parent if provided
  if (parentId !== undefined) {
    query = query.eq("parent", parentId);
  }

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [
        `title->>vi.ilike.${like}`,
        `title->>en.ilike.${like}`,
        `url.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as PracticeChild[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getPracticeChildrenByParent(parentId: number) {
  const { data, error } = await supabase
    .from("practice-child")
    .select("*")
    .eq("parent", parentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PracticeChild[];
}

export async function getPracticeChildrenByParentWithPeople(parentId: number) {
  const { data, error } = await supabase
    .from("practice-child")
    .select("*")
    .eq("parent", parentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PracticeChild[];
}
