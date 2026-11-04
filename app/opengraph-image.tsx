import { ImageResponse } from "next/og";
import { PRODUCT_NAME } from "@/lib/config";

export const alt = "Você ensina. A plataforma cuida do resto.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#12263a",
          color: "#f7f4ec",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#f2a541", letterSpacing: 4, textTransform: "uppercase" }}>
          Plataforma para professores independentes
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.05, marginTop: 28, maxWidth: 940 }}>
          Você ensina. A plataforma cuida do resto.
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#bfd0d8", marginTop: 36 }}>
          {PRODUCT_NAME} · Lista de espera aberta
        </div>
      </div>
    ),
    size,
  );
}
