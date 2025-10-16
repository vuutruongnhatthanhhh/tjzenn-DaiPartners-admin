// services/OurPeopleService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface OurPeople {
  id?: string; // uuid
  avatar: string; // text
  email: string; // citext
  name: I18N; // jsonb
  position: I18N; // jsonb
  area: I18N; // jsonb
  cv: I18N; // jsonb
  professional_summary: I18N; // jsonb
  notable_engagements: I18N[]; // jsonb[]
  bar_admissions: I18N[]; // jsonb[]
  education: I18N[]; // jsonb[]
  awards: string[]; // text[]
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
}

/** Create */
export async function createPerson(form: OurPeople) {
  const { data, error } = await supabase
    .from("our_people")
    .insert([{ ...form }])
    .select()
    .single();

  if (error) throw error;
  return data as OurPeople;
}

/** List + paginate + search (không có sort_order/active) */
export const getAllPeople = async ({
  page = 1,
  limit = 10,
  search = "",
  ascending = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  ascending?: boolean;
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("our_people").select(
    `
      id, avatar, email,
      name, position, area, cv, professional_summary,
      notable_engagements, bar_admissions, education, awards,
      created_at, updated_at
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      [
        `name->>vi.ilike.${like}`,
        `name->>en.ilike.${like}`,
        `email.ilike.${like}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as OurPeople[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
};

/** Detail */
export async function getPersonById(id: string) {
  const { data, error } = await supabase
    .from("our_people")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as OurPeople;
}

/** Update (partial) */
export async function updatePerson(id: string, form: Partial<OurPeople>) {
  const { data, error } = await supabase
    .from("our_people")
    .update({ ...form })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as OurPeople;
}

/** Delete */
export async function deletePerson(id: string) {
  const { error } = await supabase.from("our_people").delete().eq("id", id);
  if (error) throw error;
}
