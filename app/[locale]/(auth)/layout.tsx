export default function AuthLocaleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen min-w-screen">
      {children}
    </div>
  );
}