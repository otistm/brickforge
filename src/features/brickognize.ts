/** Brickognize public image-recognition API (legacy predict endpoints). */
const API_BASE = "https://api.brickognize.com";

export interface BrickognizeItem {
  id: string;
  name: string;
  img_url: string;
  category: string | null;
  type: "part" | "set" | "fig" | "sticker";
  score: number;
  external_sites: { name: string; url: string }[];
}

export interface BrickognizeResult {
  listing_id: string;
  bounding_box: {
    left: number;
    upper: number;
    right: number;
    lower: number;
    image_width: number;
    image_height: number;
    score: number;
  };
  items: BrickognizeItem[];
}

/** Uploads a photo and returns ranked LEGO part matches. */
export async function identifyPart(image: Blob, filename = "capture.jpg"): Promise<BrickognizeResult> {
  const body = new FormData();
  body.append("query_image", image, filename);

  const res = await fetch(`${API_BASE}/predict/parts/`, {
    method: "POST",
    headers: { accept: "application/json" },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Brickognize request failed (${res.status})`);
  }

  return (await res.json()) as BrickognizeResult;
}
