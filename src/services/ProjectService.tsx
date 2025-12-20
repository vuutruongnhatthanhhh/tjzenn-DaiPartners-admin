import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Project {
  id?: number; // int8 (bigint)
  title: I18N; // jsonb
  content: I18N; // jsonb
}

/* =======================
   PROJECT CRUD
   table: recent_projects
======================= */

export async function createProject(payload: Project) {
  const { data, error } = await supabase
    .from("recent_projects")
    .insert([{ ...payload }])
    .select("id, title, content")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: number, payload: Partial<Project>) {
  const { data, error } = await supabase
    .from("recent_projects")
    .update({ ...payload })
    .eq("id", id)
    .select("id, title, content")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: number) {
  const { error } = await supabase
    .from("recent_projects")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getAllProjects({
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

  let query = supabase.from("recent_projects").select(
    `
      id,
      title,
      content
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [`title->>vi.ilike.${like}`, `title->>en.ilike.${like}`].join(",")
    );
  }

  // Không có created_at => order theo id (mới nhất thường id lớn hơn)
  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as Project[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
