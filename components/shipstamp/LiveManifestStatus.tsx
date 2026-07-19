"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BuildStampRecord } from "@/lib/contract/types";
import type { DeploymentVerificationResponse } from "@/lib/deployment/types";

export function LiveManifestStatus({ stamp }: { stamp: BuildStampRecord }) {
  const [result, setResult] = useState<DeploymentVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const recheck = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await requestCurrentManifest(stamp));
    } catch {
      setResult({ verified: false, verifiedAt: new Date().toISOString(), error: { code: "FETCH_FAILED", message: "Verification service unavailable." } });
    } finally { setLoading(false); }
  }, [stamp]);

  useEffect(() => {
    let active = true;
    void requestCurrentManifest(stamp)
      .then((nextResult) => {
        if (active) setResult(nextResult);
      })
      .catch(() => {
        if (active) {
          setResult({
            verified: false,
            verifiedAt: new Date().toISOString(),
            error: { code: "FETCH_FAILED", message: "Verification service unavailable." },
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [stamp]);
  const status = getCurrentManifestStatus(result, stamp.manifestHash);

  return (
    <section className="border-t border-border pt-6" aria-live="polite">
      <p className="technical-label">Check current deployment</p>
      <p className="mt-3 font-heading text-xl">{status}</p>
      {result ? <p className="mt-2 text-xs text-muted-foreground">Last checked {new Date(result.verifiedAt).toUTCString()}. This checks the manifest now, not continuous deployment history.</p> : null}
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={recheck} disabled={loading}>{loading ? "Checking…" : "Recheck now"}</Button>
    </section>
  );
}

async function requestCurrentManifest(stamp: BuildStampRecord) {
  const response = await fetch("/api/deployment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deploymentUrl: stamp.deploymentUrl,
      expectedRepository: stamp.repository,
      expectedCommit: stamp.commitSha,
      expectedWallet: stamp.builder,
      expectedProject: stamp.project,
      schemaVersion: stamp.proofSchemaVersion,
    }),
  });
  return await response.json() as DeploymentVerificationResponse;
}

export function getCurrentManifestStatus(
  result: DeploymentVerificationResponse | null,
  recordedHash: string,
) {
  if (!result) return "Checking current deployment…";
  if ("manifestHash" in result && result.manifestHash !== recordedHash) {
    return "Current manifest has changed";
  }
  if (result.verified && result.manifestHash === recordedHash) {
    return "Current manifest matches recorded receipt";
  }
  if (result.verified) return "Current manifest has changed";
  if (
    result.error.code === "MANIFEST_NOT_FOUND" ||
    result.error.code === "FETCH_FAILED" ||
    result.error.code === "FETCH_TIMEOUT"
  ) {
    return "Manifest is currently unavailable";
  }
  if (result.error.code === "REQUEST_RATE_LIMIT") {
    return "Verification service unavailable";
  }
  return "Manifest is invalid";
}
