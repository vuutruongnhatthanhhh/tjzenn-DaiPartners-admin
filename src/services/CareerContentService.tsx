import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface CareerContent {
  id?: number; // int8 (bigint)
  content: I18N; // jsonb
  getintouch: I18N; // ← sửa thành getintouch (viết thường, không hoa)
  created_at?: string;
}

/* =======================
   CAREER CONTENT CRUD
======================= */

export async function createCareerContent(payload: CareerContent) {
  const { data, error } = await supabase
    .from("career_content")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data as CareerContent;
}

export async function updateCareerContent(
  id: number,
  payload: Partial<CareerContent>
) {
  const { data, error } = await supabase
    .from("career_content")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CareerContent;
}

export async function deleteCareerContent(id: number) {
  const { error } = await supabase.from("career_content").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllCareerContents({
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

  let query = supabase.from("career_content").select(
    `
      id,
      content,
      getintouch,
      created_at
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [
        `content->>vi.ilike.${like}`,
        `content->>en.ilike.${like}`,
        `getintouch->>vi.ilike.${like}`,
        `getintouch->>en.ilike.${like}`,
      ].join(",")
    );
  }

  const {
    data: rawData,
    error,
    count,
  } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) throw error;

  // Map thủ công để TypeScript nhận đúng kiểu và tránh lỗi missing properties
  const data: CareerContent[] = (rawData ?? []).map((item: any) => ({
    id: item.id,
    content: item.content || { vi: "", en: "" },
    getintouch: item.getintouch || { vi: "", en: "" },
    created_at: item.created_at,
  }));

  return {
    data,
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

// Phần career_people giữ nguyên vì không liên quan đến cột này
export async function getCareerPeopleIds(careerId: number) {
  const { data, error } = await supabase
    .from("career_people")
    .select("people_id")
    .eq("career_id", careerId);

  if (error) throw error;
  return (data ?? []).map((x) => x.people_id) as number[];
}

export async function setCareerPeople({
  careerId,
  peopleIds,
}: {
  careerId: number;
  peopleIds: number[];
}) {
  const clean = Array.from(new Set(peopleIds.filter(Number.isFinite)));

  const { data: currentRows, error } = await supabase
    .from("career_people")
    .select("people_id")
    .eq("career_id", careerId);

  if (error) throw error;

  const current = new Set((currentRows ?? []).map((r) => r.people_id));
  const next = new Set(clean);

  const toAdd = clean.filter((id) => !current.has(id));
  const toRemove = Array.from(current).filter((id) => !next.has(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from("career_people")
      .delete()
      .eq("career_id", careerId)
      .in("people_id", toRemove);

    if (error) throw error;
  }

  if (toAdd.length) {
    const rows = toAdd.map((people_id) => ({
      career_id: careerId,
      people_id,
    }));

    const { error } = await supabase.from("career_people").insert(rows);

    if (error && error.code !== "23505") throw error;
  }

  return { careerId, peopleIds: clean };
}
