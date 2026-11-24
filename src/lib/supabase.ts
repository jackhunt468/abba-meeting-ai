// Mode Mandiri Aktif: Mengabaikan request eksternal agar konsol bersih
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    order: () => Promise.resolve({ data: [], error: null })
  })
} as any;
