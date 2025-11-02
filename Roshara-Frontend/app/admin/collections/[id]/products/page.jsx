"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@context/AuthContext";
import {
  getCollectionProductsAdmin,
  updateCollectionProductsAdmin,
} from "@services/collectionService";

export default function ManageCollectionProductsPage() {
  const { id } = useParams() || {};
  const router = useRouter();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState([]);
  const [outside, setOutside] = useState([]);

  // Local selection
  const [toAdd, setToAdd] = useState(new Set());
  const [toRemove, setToRemove] = useState(new Set());

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/"); // not admin
      return;
    }
    if (!id || !token) return;

    setLoading(true);
    getCollectionProductsAdmin(id, token)
      .then(({ inCollection, outside }) => {
        setInCollection(inCollection || []);
        setOutside(outside || []);
      })
      .finally(() => setLoading(false));
  }, [id, token, user, router]);

  const handleToggleAdd = (pid) => {
    setToAdd((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  };

  const handleToggleRemove = (pid) => {
    setToRemove((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  };

  const saveChanges = async () => {
    if (!token) return;
    const payload = {
      add: Array.from(toAdd),
      remove: Array.from(toRemove),
    };
    await updateCollectionProductsAdmin(id, payload, token);
    // Refresh lists
    const fresh = await getCollectionProductsAdmin(id, token);
    setInCollection(fresh.inCollection || []);
    setOutside(fresh.outside || []);
    setToAdd(new Set());
    setToRemove(new Set());
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Manage Products</h1>
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Manage Products in Collection</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Back
          </button>
          <button
            onClick={saveChanges}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: products currently in the collection */}
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">In this collection</h2>
          {inCollection.length === 0 ? (
            <p className="text-gray-600">No products.</p>
          ) : (
            <ul className="space-y-2">
              {inCollection.map((p) => (
                <li key={p._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">₹{p.price}</div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={toRemove.has(p._id)}
                      onChange={() => handleToggleRemove(p._id)}
                    />
                    <span>Remove</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: products outside the collection */}
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Available to add</h2>
          {outside.length === 0 ? (
            <p className="text-gray-600">No products available.</p>
          ) : (
            <ul className="space-y-2">
              {outside.map((p) => (
                <li key={p._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">₹{p.price}</div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={toAdd.has(p._id)}
                      onChange={() => handleToggleAdd(p._id)}
                    />
                    <span>Add</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
