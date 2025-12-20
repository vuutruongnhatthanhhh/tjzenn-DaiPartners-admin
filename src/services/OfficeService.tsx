import { supabase } from "@/lib/supabaseClient";

export type I18N = { vi?: string; en?: string };

export interface Office {
  id?: number; // int8 (bigint)
  title: I18N; // jsonb
  address: I18N; // jsonb
  phone?: string | null;
  email?: string | null;
  tax_code?: string | null;
  image?: string | null;
  gg_map?: string | null;
}

/* =======================
   OFFICE CRUD
======================= */

export async function createOffice(payload: Office) {
  const { data, error } = await supabase
    .from("offices")
    .insert([
      {
        title: { vi: payload.title?.vi || "", en: payload.title?.en || "" },
        address: {
          vi: payload.address?.vi || "",
          en: payload.address?.en || "",
        },
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        tax_code: payload.tax_code ?? null,
        image: payload.image ?? null,
        gg_map: payload.gg_map ?? null,
      },
    ])
    .select(
      `
        id,
        title,
        address,
        phone,
        email,
        tax_code,
        image,
        gg_map
      `
    )
    .single();

  if (error) throw error;
  return data as Office;
}

export async function updateOffice(id: number, payload: Partial<Office>) {
  const updateData: Partial<Office> = {};

  if (payload.title) {
    updateData.title = {
      vi: payload.title.vi || "",
      en: payload.title.en || "",
    };
  }

  if (payload.address) {
    updateData.address = {
      vi: payload.address.vi || "",
      en: payload.address.en || "",
    };
  }

  if (payload.phone !== undefined) updateData.phone = payload.phone ?? null;
  if (payload.email !== undefined) updateData.email = payload.email ?? null;
  if (payload.tax_code !== undefined)
    updateData.tax_code = payload.tax_code ?? null;

  if (payload.image !== undefined) updateData.image = payload.image ?? null; // ✅ thêm
  if (payload.gg_map !== undefined) updateData.gg_map = payload.gg_map ?? null;

  const { data, error } = await supabase
    .from("offices")
    .update(updateData)
    .eq("id", id)
    .select(
      `
        id,
        title,
        address,
        phone,
        email,
        tax_code,
        image,
        gg_map
      `
    )
    .single();

  if (error) throw error;
  return data as Office;
}

export async function deleteOffice(id: number) {
  const { error } = await supabase.from("offices").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllOffices({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("offices")
    .select(
      `
        id,
        title,
        address,
        phone,
        email,
        tax_code,
        image,
        gg_map
      `,
      { count: "exact" }
    )
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as Office[],
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
