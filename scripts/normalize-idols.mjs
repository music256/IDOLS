// scripts/normalize-idols.mjs
import fs from "node:fs";

const INPUT = "idols_a.json";
const OUT_JSON = "idols_a_normalized.json";
const OUT_CSV = "idols_a_upload_manifest.csv";

// ปรับค่า 2 บรรทัดนี้ให้ตรงของคุณ (ถ้าอยากเปลี่ยน)
const CLOUD_NAME = "dxtzqrhns";
const DEFAULT_TRANSFORM = "f_auto,q_auto";

const baseDelivery = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

function makePublicId(slug, id) {
  const n = Number(id);
  const pad = n < 100 ? 2 : 3;
  return `${slug}-${String(n).padStart(pad, "0")}`;
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const raw = fs.readFileSync(INPUT, "utf-8");
const data = JSON.parse(raw);

const out = {
  version: "1.2",
  cloudinary: {
    cloud_name: CLOUD_NAME,
    base_delivery: baseDelivery,
    default_transform: DEFAULT_TRANSFORM,
  },
  idols: [],
};

const csvRows = [
  ["idol_slug", "idol_name", "image_id", "public_id", "cloudinary_url", "source_url", "sfw", "name"].join(","),
];

for (const idol of data.idols ?? []) {
  const slug = idol.idol_slug;
  const idolName = idol.idol_name;
  const images = [...(idol.images ?? [])].sort((a, b) => Number(a.id) - Number(b.id));

  const newImages = images.map((img) => {
    const imageId = Number(img.id);
    const publicId = makePublicId(slug, imageId);
    const cloudinaryUrl = `${baseDelivery}/${DEFAULT_TRANSFORM}/${publicId}`;

    csvRows.push(
      [
        slug,
        idolName,
        imageId,
        publicId,
        cloudinaryUrl,
        img.url ?? "",
        img.sfw ?? true,
        img.name ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );

    return {
      id: imageId,
      public_id: publicId,
      cloudinary_url: cloudinaryUrl,
      source_url: img.url,
      name: img.name,
      alt: img.alt,
      description: img.description,
      sfw: Boolean(img.sfw ?? true),
    };
  });

  out.idols.push({
    idol_slug: slug,
    idol_name: idolName,
    images: newImages,
  });
}

fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), "utf-8");
fs.writeFileSync(OUT_CSV, csvRows.join("\n"), "utf-8");

console.log(`OK: wrote ${OUT_JSON} and ${OUT_CSV}`);
