"use client";

import Link from "next/link";

export default function CollectionCard({ collection }) {
  const title = collection?.name || "Collection";
  const desc = collection?.description || "";

  return (
    <Link
      href={`/collections/${collection?._id}`}
      className="group block h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      aria-label={`Open collection ${title}`}
    >
      <div
        className="
          bg-white
          border border-gray-100
          rounded-2xl
          p-6 md:p-8
          h-full
          flex flex-col justify-between
        "
      >
        {/* Top meta (keeps vertical rhythm consistent) */}
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
            Collection
          </span>
        </div>

        {/* Middle: Title + Description */}
        <div className="mt-4">
          <h3
            className="
              text-2xl md:text-3xl font-extrabold
              text-gray-900
              leading-tight
              mb-4
              line-clamp-2
            "
          >
            {title}
          </h3>

          {desc ? (
            <div
              className="
                bg-gray-50 border border-gray-100
                rounded-lg p-4
                text-gray-700 text-sm
                leading-relaxed
                shadow-sm
                max-w-none
              "
            >
              <p className="line-clamp-3">{desc}</p>
            </div>
          ) : (
            // keep space even when description missing to preserve card rhythm
            <div className="h-12" aria-hidden />
          )}
        </div>

        {/* Footer / Action: pushed to bottom by flex layout */}
        <div className="mt-6 flex items-center justify-end">
          <span
            className="
              inline-block
              bg-white/95
              border border-gray-200
              text-gray-800
              px-4 py-2 rounded-md
              text-sm font-medium
              shadow
              group-hover:bg-white
              transition-colors duration-200
            "
          >
            View Collection
          </span>
        </div>
      </div>
    </Link>
  );
}
