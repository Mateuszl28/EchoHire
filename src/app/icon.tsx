import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          color: "white",
          fontSize: 22,
          fontWeight: 900,
          borderRadius: 6,
        }}
      >
        E
      </div>
    ),
    { ...size }
  );
}
