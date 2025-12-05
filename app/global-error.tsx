// app/global-error.tsx
'use client';

// ✅ บังคับให้เป็น Dynamic เพื่อแก้ Bug ตอน Build
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Application Error
          </h2>
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>
            {error?.message || "Something went wrong during rendering."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}