export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Café des Amis — API</h1>
      <p>
        Endpoints disponibles : <code>GET /api/health</code>,{" "}
        <code>/api/menu</code>, <code>/api/menu/[id]</code>.
      </p>
    </main>
  );
}
