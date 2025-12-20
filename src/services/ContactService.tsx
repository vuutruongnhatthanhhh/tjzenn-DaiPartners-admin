// services/ContactService.ts
import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

// Interface nhỏ gọn cho preview khi list
export interface OfficePreview {
  id: number;
  title: I18N;
  address: I18N;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface PeoplePreview {
  id: number;
  avatar?: string | null;
  email: string;
  name: I18N;
  position: I18N;
}

// Interface Contact duy nhất (có gg_map_embed)
export interface Contact {
  id: number;
  id_office: number;
  id_people: number;
  gg_map_embed?: string | null; // cho embed map chuẩn
  office?: OfficePreview;
  people?: PeoplePreview;
}

// Create contact
export async function createContact(
  id_office: number,
  id_people: number,
  gg_map_embed?: string | null
) {
  const { data, error } = await supabase
    .from("contact")
    .insert({ id_office, id_people, gg_map_embed })
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

// Update contact
export async function updateContact(
  id: number,
  payload: {
    id_office?: number;
    id_people?: number;
    gg_map_embed?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("contact")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

// Delete
export async function deleteContact(id: number) {
  const { error } = await supabase.from("contact").delete().eq("id", id);
  if (error) throw error;
}

// Get all + pagination + search
export async function getAllContacts({
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

  let query = supabase.from("contact").select(
    `
      id,
      id_office,
      id_people,
      gg_map_embed,
      office:offices (
        id,
        title,
        address,
        phone,
        email,
        image
      ),
      people:our_people (
        id,
        avatar,
        email,
        name,
        position
      )
    `,
    { count: "exact" }
  );

  const s = (search ?? "").trim();
  if (s) {
    const like = `%${s}%`;
    query = query.or(
      `
      office.title->>vi.ilike.${like},
      office.title->>en.ilike.${like},
      people.name->>vi.ilike.${like},
      people.name->>en.ilike.${like},
      people.email.ilike.${like}
      `
    );
  }

  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as Contact[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
