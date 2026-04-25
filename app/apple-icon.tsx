import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — black tile, gold "L". Satori (the engine behind
// ImageResponse) bundles a sans-serif default; that reads cleanly at this
// size, so we don't ship a font asset just for the home-screen tile.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#070707",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 132,
          fontWeight: 600,
          color: "#c9a860",
        }}
      >
        L
      </div>
    ),
    { ...size },
  );
}
