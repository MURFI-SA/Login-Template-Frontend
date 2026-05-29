/**
 * Shared type exports.
 * Mirrored from the backend `shared/types.ts` — keep both files in sync.
 */

/** User roles. Extend as your project requires. */
export type RolUsuario = "user" | "admin";

export interface Usuario {
    id: string;
    nombre: string | null;
    email: string;
    rol: RolUsuario;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
}

export * from "./_core/errors";
