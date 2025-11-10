// app/components/CollectionCard.jsx
"use client";

import Link from "next/link";
import { resolveImg } from "../../utils/img";

export default function CollectionCard({ collection }) {
  const title = collection?.name || "Collection";
  const desc = collection?.description || "";
  const src = resolveImg(collection?.image || collection?.cover || collection?.imageUrl);

  return (
    <Link
      href={`/collections/${collection?._id}`}
      className="group block h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      aria-label={`Open collection ${title}`}
    >
      <div className="relative h-60 md:h-64">
        {src ? (
          // using a regular <img> avoids needing next.config.js for external domains
          // and keeps layout predictable
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-50" />
        )}

        {/* overlay to darken image for readable text */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/35 transition-colors" />
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between text-white">
          <div>
            <span className="text-xs font-semibold uppercase text-white/90 tracking-wide">
              Collection
            </span>

            <h3 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight line-clamp-2">
              {title}
            </h3>
          </div>

          {desc ? (
            <div className="bg-white/80 text-black rounded-lg p-3 mt-4 inline-block max-w-full shadow-sm">
              <p className="text-sm line-clamp-3">{desc}</p>
            </div>
          ) : (
            <div className="h-12" aria-hidden />
          )}
        </div>
      </div>
    </Link>
  );
}
