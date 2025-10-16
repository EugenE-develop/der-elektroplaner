import { createClient } from '@supabase/supabase-js';

// WICHTIGER SICHERHEITSHINWEIS:
// Die Anmeldeinformationen sind hier zur einfachen Demonstration direkt im Code hinterlegt.
// In einer Produktionsumgebung ist es zwingend erforderlich, diese Werte als Umgebungsvariablen 
// (z.B. import.meta.env.VITE_SUPABASE_URL) zu speichern und aus dem Quellcode zu entfernen.
// Das Offenlegen dieser Schlüssel kann Ihr Supabase-Projekt Sicherheitsrisiken aussetzen.

const supabaseUrl = 'https://ytghvubdhupnucuuywck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Z2h2dWJkaHVwbnVjdXV5d2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODkzMDEsImV4cCI6MjA3NDY2NTMwMX0.r0rFJtLT7mEalwSvRq62JaWFmml1_MGH3FI0LIErrMY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL und anonymer Schlüssel sind nicht festgelegt.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);