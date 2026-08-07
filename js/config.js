// Dados do seu projeto Supabase — pegue em Settings > API no painel do Supabase.
// A "anon key" é uma chave PÚBLICA por design: pode ficar no código sem problema,
// quem protege os dados são as regras (Row Level Security) configuradas no banco,
// não o segredo da chave. Veja supabase-setup.sql para essas regras.
const SUPABASE_URL = "https://vfygbmhontdlgfjasjjh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeWdibWhvbnRkbGdmamFzampoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTY0NjYsImV4cCI6MjEwMTYzMjQ2Nn0.3lWqecovl-5NRC5PGSQcy6rMe0TnMgEHbWcegccD2mw";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
