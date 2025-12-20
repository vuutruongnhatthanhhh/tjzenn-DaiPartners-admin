import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface About {
  id?: number; // int8 (bigint)
  title: I18N; // jsonb
  content: I18N; // jsonb
  created_at?: string;
}

/* =======================
   ABOUT CRUD
======================= */

export async function createAbout(payload: About) {
  const { data, error } = await supabase
    .from("about")
    .insert([{ ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data as About;
}

export async function updateAbout(id: number, payload: Partial<About>) {
  const { data, error } = await supabase
    .from("about")
    .update({ ...payload })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as About;
}

export async function deleteAbout(id: number) {
  const { error } = await supabase.from("about").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllAbouts({
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

  let query = supabase.from("about").select(
    `
      id,
      title,
      content,
      created_at
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

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as About[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

/* =======================
   ABOUT ↔ PEOPLE
   table: about_people
======================= */

export async function getAboutPeopleIds(aboutId: number) {
  const { data, error } = await supabase
    .from("about_people")
    .select("people_id")
    .eq("about_id", aboutId);

  if (error) throw error;
  return (data ?? []).map((x) => x.people_id) as number[];
}

export async function setAboutPeople({
  aboutId,
  peopleIds,
}: {
  aboutId: number;
  peopleIds: number[];
}) {
  const clean = Array.from(new Set(peopleIds.filter(Number.isFinite)));

  // load current
  const { data: currentRows, error } = await supabase
    .from("about_people")
    .select("people_id")
    .eq("about_id", aboutId);

  if (error) throw error;

  const current = new Set((currentRows ?? []).map((r) => r.people_id));
  const next = new Set(clean);

  const toAdd = clean.filter((id) => !current.has(id));
  const toRemove = Array.from(current).filter((id) => !next.has(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from("about_people")
      .delete()
      .eq("about_id", aboutId)
      .in("people_id", toRemove);

    if (error) throw error;
  }

  if (toAdd.length) {
    const rows = toAdd.map((people_id) => ({
      about_id: aboutId,
      people_id,
    }));

    const { error } = await supabase.from("about_people").insert(rows);

    // @ts-ignore
    if (error && error.code !== "23505") throw error;
  }

  return { aboutId, peopleIds: clean };
}
