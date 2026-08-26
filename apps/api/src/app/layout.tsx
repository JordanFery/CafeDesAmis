export const metadata = {
  title: "Les Amis de la Montagne — API",
  description: "API backend pour l'application Les Amis de la Montagne",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
