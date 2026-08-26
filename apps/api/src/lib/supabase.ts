import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Client anonyme, utilisé uniquement pour vérifier les tokens d'accès
 * envoyés par le mobile (Authorization: Bearer <token>).
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Client admin (service role) : contourne RLS, utilisé pour les opérations
 * privilégiées côté serveur (ex. créer un compte Supabase Auth pour un
 * nouvel employé). Ne jamais exposer cette clé au client.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
