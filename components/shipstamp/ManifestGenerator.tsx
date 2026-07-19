"use client";

import { Button } from "@/components/ui/button";
import type { ShipStampManifest } from "@/lib/manifest/schema";
import { serializeManifest } from "@/lib/manifest/schema";

export function ManifestGenerator({ manifest }: { manifest: ShipStampManifest }) {
  const json = serializeManifest(manifest);
  const copy = async () => navigator.clipboard.writeText(json);
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shipstamp.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-border bg-background/40 p-5" aria-labelledby="manifest-heading">
      <p className="technical-label text-primary">02 / Install manifest</p>
      <h3 id="manifest-heading" className="mt-3 font-heading text-2xl">Publish this deployment proof</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Serve this exact JSON at <code className="text-foreground">/.well-known/shipstamp.json</code>, then deploy the site.</p>
      <pre className="mt-5 max-h-80 overflow-auto border-l border-primary/50 bg-background p-4 font-mono text-xs leading-6 text-foreground">{json}</pre>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={copy}>Copy manifest</Button>
        <Button type="button" variant="outline" onClick={download}>Download shipstamp.json</Button>
      </div>
      <div className="mt-6 grid gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
        <p><strong className="text-foreground">Next.js</strong><br />public/.well-known/shipstamp.json</p>
        <p><strong className="text-foreground">Vite / static</strong><br />public/.well-known/shipstamp.json</p>
        <p><strong className="text-foreground">Other</strong><br />Serve the JSON from the exact public path.</p>
      </div>
    </section>
  );
}
