"use client";
import { useState } from "react";
import Modal from "./Modal";

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  createdAt: string;
}

export default function PhotoGallery({
  photos,
  memberId,
  onUpload,
}: {
  photos: Photo[];
  memberId: string;
  onUpload?: () => void;
}) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const caption = file.name.replace(/\.[^.]+$/, "");
      await fetch(`/api/members/${memberId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, caption }),
      });
      setUploading(false);
      onUpload?.();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Upload button */}
      <div style={{ marginBottom: 16 }}>
        <label className="btn-secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
          {uploading ? "Uploading..." : "📷 Add Photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.5 }}>📷</div>
          <p>No photos yet</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="photo-item"
              onClick={() => setLightbox(photo)}
            >
              <img src={photo.url} alt={photo.caption || "Photo"} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.caption || "Photo"}>
        {lightbox && (
          <div>
            <img
              src={lightbox.url}
              alt={lightbox.caption || "Photo"}
              style={{ width: "100%", borderRadius: 12, marginBottom: 12 }}
            />
            {lightbox.caption && (
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{lightbox.caption}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
