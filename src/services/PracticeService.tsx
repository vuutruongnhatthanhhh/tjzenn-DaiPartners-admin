import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Practice {
  id?: number; // int8
  url?: string | null; // unique
  title: I18N; // jsonb
  content: I18N; // jsonb
  image?: string | null;
  created_at?: string;
}

/* =======================
   PRACTICE CRUD
======================= */

export async function createPractice(payload: Practice) {
  const { data, error } = await supabase
    .from("practices")
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

  return data as Practice;
}

export async function updatePractice(id: number, payload: Partial<Practice>) {
  const { data, error } = await supabase
    .from("practices")
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

  return data as Practice;
}

export async function deletePractice(id: number) {
  const { error } = await supabase.from("practices").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllPractices({
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

  let query = supabase.from("practices").select(
    `
      id,
      url,
      title,
      content,
      image,
      created_at
    `,
    { count: "exact" },
  );

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
    data: (data ?? []) as Practice[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

/* =======================
   PRACTICE ↔ PEOPLE
   table: practice_people
======================= */

export async function getPracticePeopleIds(practiceId: number) {
  const { data, error } = await supabase
    .from("practice_people")
    .select("people_id")
    .eq("practice_id", practiceId);

  if (error) throw error;
  return (data ?? []).map((x) => x.people_id) as number[];
}

export async function setPracticePeople({
  practiceId,
  peopleIds,
}: {
  practiceId: number;
  peopleIds: number[];
}) {
  const clean = Array.from(new Set(peopleIds.filter(Number.isFinite)));

  // load current
  const { data: currentRows, error } = await supabase
    .from("practice_people")
    .select("people_id")
    .eq("practice_id", practiceId);

  if (error) throw error;

  const current = new Set((currentRows ?? []).map((r) => r.people_id));
  const next = new Set(clean);

  const toAdd = clean.filter((id) => !current.has(id));
  const toRemove = Array.from(current).filter((id) => !next.has(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from("practice_people")
      .delete()
      .eq("practice_id", practiceId)
      .in("people_id", toRemove);

    if (error) throw error;
  }

  if (toAdd.length) {
    const rows = toAdd.map((people_id) => ({
      practice_id: practiceId,
      people_id,
    }));

    const { error } = await supabase.from("practice_people").insert(rows);

    // @ts-ignore
    if (error && error.code !== "23505") throw error;
  }

  return { practiceId, peopleIds: clean };
}
