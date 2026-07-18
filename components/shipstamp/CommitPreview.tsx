import type { VerifiedGitHubCommit } from "@/lib/github/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CommitPreview({ commit }: { commit: VerifiedGitHubCommit }) {
  return (
    <section
      className="border border-border bg-background/40 p-5"
      aria-labelledby="verified-commit-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-[var(--success)]/30 bg-[var(--success)]/5 font-mono text-[0.62rem] tracking-[0.1em] text-[var(--success)] uppercase"
          >
            GitHub response / verified
          </Badge>
          <h3
            id="verified-commit-heading"
            className="mt-3 font-heading text-2xl"
          >
            Public commit located
          </h3>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={commit.commitUrl} target="_blank" rel="noreferrer">
            Inspect commit ↗
          </a>
        </Button>
      </div>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <PreviewField label="Repository" value={commit.repositoryFullName} />
        <PreviewField label="Commit" value={commit.commitSha} />
        <PreviewField
          label="Author metadata"
          value={`${commit.commitAuthorName}${commit.commitAuthorUsername ? ` (@${commit.commitAuthorUsername})` : ""}`}
        />
        <PreviewField
          label="Commit timestamp"
          value={new Date(commit.commitDate).toUTCString()}
        />
        <div className="sm:col-span-2">
          <PreviewField
            label="Commit message"
            value={commit.commitMessage}
            mono={false}
          />
        </div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 font-mono text-[0.65rem] leading-5 text-muted-foreground">
        GitHub author metadata is not wallet identity.
      </p>
    </section>
  );
}

function PreviewField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm leading-6 ${mono ? "technical-value" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
