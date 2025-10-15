import { supabase } from "@/lib/supabaseClient";
import { getSession } from "next-auth/react";
import { checkAdmin, checkModOrAdmin } from "@/lib/checkRole";

export interface Lesson {
  id: number;
  title: string;
  videoUrl: string;
  content: string;
  course: number | { id: number; title: string };
}
export const createLesson = async (data: Lesson) => {
  await checkModOrAdmin();
  const { title, videoUrl, content, course } = data;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert([
      {
        title,
        videoUrl,
        content,
        course,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lesson: ${error.message}`);
  }

  return lesson;
};

export const updateLesson = async (id: number, data: Partial<Lesson>) => {
  await checkAdmin();
  const { title, videoUrl, content, course } = data;

  const { data: updatedLesson, error } = await supabase
    .from("lessons")
    .update({
      ...(title !== undefined && { title }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(content !== undefined && { content }),
      ...(course !== undefined && { course }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lesson: ${error.message}`);
  }

  return updatedLesson;
};

export const getAllLessons = async ({
  page = 1,
  limit = 10,
  search = "",
  course = 0,
}: {
  page?: number;
  limit?: number;
  search?: string;
  course?: number;
}) => {
  await checkModOrAdmin();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("lessons")
    .select("id, title, videoUrl, content, course(id, title), created_at", {
      count: "exact",
    });

  //  search
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // filter
  if (course) {
    query = query.eq("course", course);
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

export const deleteLesson = async (id: number) => {
  await checkAdmin();
  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete lesson: ${error.message}`);
  }
};
