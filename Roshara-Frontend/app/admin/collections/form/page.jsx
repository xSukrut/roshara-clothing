// app/admin/collections/form/page.jsx
import CollectionFormClient from "./CollectionFormClient";

export default function Page({ searchParams }) {
  const id = searchParams?.id ?? null; // /admin/collections/form?id=...
  return <CollectionFormClient editId={id} />;
}
