// Variables d'environnement factices : aucun accès réseau ni vrai secret dans les tests
process.env.JWT_SECRET = 'secret-de-test'
process.env.SUPABASE_URL = 'http://supabase.test'
process.env.SUPABASE_KEY = 'cle-de-test'
delete process.env.GROQ_API_KEY
