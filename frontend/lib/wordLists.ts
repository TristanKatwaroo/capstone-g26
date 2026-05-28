import { createClient } from "@/lib/supabase/client";

export function parseCommaSeparatedWords(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function getSavedWordList() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("word_lists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function saveWordList(words: string[]) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be logged in to save a word list.");
  }

  const existing = await getSavedWordList();

  if (existing) {
    const { data, error } = await supabase
      .from("word_lists")
      .update({
        words,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  const { data, error } = await supabase
    .from("word_lists")
    .insert({
      user_id: user.id,
      name: "Default Word List",
      words,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}