import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Você está offline | Fluency Lab",
  description: "Sem conexão com a internet",
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
