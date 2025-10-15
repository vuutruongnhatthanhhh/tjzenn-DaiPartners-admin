import { checkAdmin, checkModOrAdmin } from "@/lib/checkRole";
import { supabase } from "@/lib/supabaseClient";

export type Course = {
  title: string;
  url: string;
  image: string;
  shortDescription: string;
  category: string;
  author: number; // user_id
  isHide: boolean;
  isFree: boolean;
  price?: number;
  goals?: string[];
  includes?: string[];
  accordion?: any; // JSON structure
  videoDemo?: string;
  chapterCount?: number;
  lessonCount?: number;
  hourCount?: number;
};

export const createCourse = async (data: Course) => {
  await checkModOrAdmin();
  const { error, data: insertedCourse } = await supabase
    .from("courses")
    .insert([
      {
        ...data,
        isHide: data.isHide ?? false,
        isFree: data.isFree ?? false,
        price: data.price ?? 0,
        goals: data.goals ?? [],
        includes: data.includes ?? [],
        accordion: data.accordion ?? [],
        videoDemo: data.videoDemo ?? null,
        chapterCount: data.chapterCount ?? 0,
        lessonCount: data.lessonCount ?? 0,
        hourCount: data.hourCount ?? 0,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi khi tạo khóa học: ${error.message}`);
  }

  return insertedCourse;
};

export const getAllCourses = async ({
  page = 1,
  limit = 10,
  search = "",
  category = "",
  author = null,
  isFree,
  isHide,
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  author?: number | null;
  isFree?: boolean;
  isHide?: boolean;
}) => {
  await checkModOrAdmin();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("courses")
    .select(
      "id, title, url, image, shortDescription, category, author, isFree, isHide, price, goals, includes, accordion, videoDemo, chapterCount, lessonCount, hourCount, created_at",
      { count: "exact" }
    );

  // search
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // filter
  if (category) {
    query = query.eq("category", category);
  }

  if (author !== null) {
    query = query.eq("author", author);
  }

  if (typeof isFree === "boolean") {
    query = query.eq("isFree", isFree);
  }

  if (typeof isHide === "boolean") {
    query = query.eq("isHide", isHide);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
};

export const updateCourse = async (id: number, data: Partial<Course>) => {
  await checkAdmin();
  const { error, data: updatedCourse } = await supabase
    .from("courses")
    .update({
      ...data,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi khi cập nhật khóa học: ${error.message}`);
  }

  return updatedCourse;
};

export const deleteCourse = async (id: number) => {
  await checkAdmin();
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    throw new Error(`Lỗi khi xóa khóa học: ${error.message}`);
  }

  return true;
};
