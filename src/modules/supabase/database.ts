type Row = Record<string, unknown>;
type Table = { Row: Row; Insert: Row; Update: Row; Relationships: [] };

// Keep client-side query shape typed before generated Supabase types are
// committed. Migrations remain the source of truth for columns and policies.
export type NeervaDatabase = {
  public: {
    Tables: Record<string, Table>;
    Views: Record<string, never>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};
