import type { VerifiedGitHubCommit } from "@/lib/github/types";

export function CommitPreview({ commit }: { commit: VerifiedGitHubCommit }) {
  return (
    <section className="border-t border-[var(--rule)] pt-6" aria-labelledby="verified-commit-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="verified-commit-heading" className="text-lg font-bold">
          Public GitHub commit verified
        </h3>
        <a
          href={commit.commitUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold underline underline-offset-4"
        >
          Inspect commit ↗
        </a>
      </div>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <PreviewField label="Repository" value={commit.repositoryFullName} />
        <PreviewField label="Commit" value={commit.commitSha} />
        <PreviewField
          label="Author metadata"
          value={`${commit.commitAuthorName}${commit.commitAuthorUsername ? ` (@${commit.commitAuthorUsername})` : ""}`}
        />
        <PreviewField label="Commit timestamp" value={new Date(commit.commitDate).toUTCString()} />
        <div className="sm:col-span-2">
          <PreviewField label="Commit message" value={commit.commitMessage} mono={false} />
        </div>
      </dl>
      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
        GitHub author metadata is display information. It does not connect that identity to the
        wallet creating this claim.
      </p>
    </section>
  );
}

function PreviewField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className={`mt-1 break-words text-sm leading-6 ${mono ? "technical-value" : ""}`}>{value}</dd>
    </div>
  );
}

