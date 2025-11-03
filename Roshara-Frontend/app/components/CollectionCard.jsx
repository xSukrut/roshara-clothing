// app/components/CollectionCard.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { resolveImg } from "@/utils/img";

export default function CollectionCard({ collection }) {
  // Prefer the normalized resolver so we handle:
  // - Absolute Cloudinary URLs
  // - Local `/uploads/...` served by your backend
  // - Any alternate fields you might send
  const cover = resolveImg(
    collection?.image || collection?.cover || collection?.imageUrl
  );

  const title = collection?.name || "Collection";

  return (
    <Link
      href={`/collections/${collection?._id}`}
      className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-60 w-full">
        <Image
          src={cover || "/placeholder.png"}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-all duration-300" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-4">
        <h3 className="text-xl font-semibold tracking-wide drop-shadow-md">
          {title}
        </h3>
        {collection?.description ? (
          <p className="text-sm mt-2 text-gray-200 line-clamp-2 max-w-xs">
            {collection.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
