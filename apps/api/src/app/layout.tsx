export const metadata = {
  title: "Café des Amis API",
  description: "API backend pour l'application Café des Amis",
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
