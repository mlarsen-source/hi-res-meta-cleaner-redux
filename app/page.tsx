"use client";

import { useEffect } from "react";
import { useAuth } from "./components/AuthProvider";
import { useCollection } from "./hooks/useCollection";
import { UploadSection } from "./components/UploadSection";
import { CollectionTable } from "./components/CollectionTable";
import { LoginPrompt } from "./components/LoginPrompt";

export default function Home() {
  const { user } = useAuth();
  const { files, loading, error, refresh, updateFile } = useCollection();

  useEffect(() => {
    if (user) void refresh();
    // Only re-run when the auth state changes (user logs in/out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Collection</h1>
      <UploadSection onUploaded={refresh} />
      {loading && (
        <p className="text-sm text-gray-400" data-testid="loading">
          Loading…
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && <CollectionTable files={files} onFileUpdated={updateFile} />}
    </div>
  );
}
