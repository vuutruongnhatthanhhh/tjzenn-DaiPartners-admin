// services/CareerService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Career {
  id?: number; // int8
  name: I18N; // jsonb
  location?: I18N; // jsonb
  age?: I18N; // jsonb
  salary?: I18N; // jsonb
  type?: I18N; // jsonb
  gender?: I18N; // jsonb
  job_description?: I18N; // jsonb
  job_requirements?: I18N[];
  email?: string; // text
  created_at?: string; // timestamp
}

/** Create */
export async function createCareer(form: Career) {
  const { data, error } = await supabase
    .from("careers")
    .insert([{ ...form }])
    .select()
    .single();

  if (error) throw error;
  return data as Career;
}

/** List + paginate + search (CHỈ search theo name) */
export const getAllCareers = async ({
  page = 1,
  limit = 10,
  search = "",
  ascending = false, // sort theo created_at
}: {
  page?: number;
  limit?: number;
  search?: string;
  ascending?: boolean;
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("careers").select(
    `
      id,
      name,
      location,
      age,
      salary,
      type,
      gender,
      job_description,
      job_requirements,
      email,
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

  const { data, error, count } = await query
    .order("created_at", { ascending })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Career[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
};

/** Detail */
export async function getCareerById(id: number) {
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Career;
}

/** Update (partial) */
export async function updateCareer(id: number, form: Partial<Career>) {
  const { data, error } = await supabase
    .from("careers")
    .update({ ...form })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Career;
}

/** Delete */
export async function deleteCareer(id: number) {
  const { error } = await supabase.from("careers").delete().eq("id", id);
  if (error) throw error;
}
