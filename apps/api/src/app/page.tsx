export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Les Amis de la Montagne — API</h1>
      <p>
        Endpoints disponibles : <code>GET /api/health</code>,{" "}
        <code>/api/users/me</code>, <code>/api/locations</code>,{" "}
        <code>/api/suppliers</code>, <code>/api/categories</code>,{" "}
        <code>/api/products</code>.
      </p>
      <p>Toutes les routes (sauf /api/health) nécessitent un token Supabase.</p>
    </main>
  );
}
