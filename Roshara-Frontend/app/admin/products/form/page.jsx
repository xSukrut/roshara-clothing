// app/admin/products/form/page.jsx
import ProductFormClient from "./ProductFormClient";

export default function Page({ searchParams }) {
  const id = searchParams?.id ?? null; // /admin/products/form?id=...
  return <ProductFormClient editId={id} />;
}
