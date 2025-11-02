"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductGrid from "../../../components/NewArrivals/ProductCard";
import { getCollection } from "../../../../services/collectionService";
import { getAllProducts } from "../../../../services/productService";
import { useAuth } from "../../../../context/AuthContext"; 


export default function CollectionDetailPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const { user } = useAuth();

// in the JSX header area:
<div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-semibold mb-1">{collection.name}</h1>
  {user?.role === "admin" && (
    <Link
      href={`/admin/collections/${id}/products`}
      className="px-4 py-2 border rounded"
    >
      Manage products
    </Link>
  )}
</div>

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const coll = await getCollection(id);
        setCollection(coll);

        // ask backend for products filtered by collection (see backend enhancement below)
        const prods = await getAllProducts({ collection: id });
        setProducts(prods);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [id]);

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">
        {collection?.name || "Collection"}
      </h1>
      {collection?.description && (
        <p className="mb-4">{collection.description}</p>
      )}
      <ProductGrid products={products} />
    </section>
  );
}
