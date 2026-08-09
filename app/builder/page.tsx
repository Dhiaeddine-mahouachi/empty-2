import { Suspense } from "react";
import BuilderClient from "./builder-client";

export default function BuilderPage() {
  return <Suspense fallback={<main className="loading-page">Site Studio hazırlanıyor…</main>}><BuilderClient /></Suspense>;
}
