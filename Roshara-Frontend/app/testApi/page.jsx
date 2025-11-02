"use client";
import { useEffect, useState } from "react";
import api from "../../lib/apiClient";

export default function TestApi() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    api.get("/products").then(r => setResult(r.data)).catch(e => setResult({ error: e.message }));
  }, []);
  return <pre className="p-6">{JSON.stringify(result, null, 2)}</pre>;
}
