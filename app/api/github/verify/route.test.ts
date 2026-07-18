// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const repositoryUrl = "https://github.com/kopachlager/ShipStamp";
const commitSha = "a".repeat(40);

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GITHUB_TOKEN;
});

describe("POST /api/github/verify", () => {
  it("returns the required public commit metadata", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          full_name: "kopachlager/ShipStamp",
          html_url: repositoryUrl,
          private: false,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          sha: commitSha,
          html_url: `${repositoryUrl}/commit/${commitSha}`,
          commit: {
            message: "feat: validate public GitHub commits",
            author: { name: "Builder", date: "2026-07-18T08:00:00Z" },
          },
          author: { login: "kopachlager" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest({ repositoryUrl, commitSha }, "success"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      repositoryFullName: "kopachlager/ShipStamp",
      commitSha,
      shortCommitSha: "aaaaaaa",
      commitAuthorName: "Builder",
      commitAuthorUsername: "kopachlager",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a malformed repository before calling GitHub", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest({ repositoryUrl: "https://gitlab.com/owner/repo", commitSha }, "invalid-repo"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNSUPPORTED_GIT_PROVIDER" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe missing commit response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ full_name: "kopachlager/ShipStamp", html_url: repositoryUrl, private: false }),
        )
        .mockResolvedValueOnce(Response.json({ message: "Not Found" }, { status: 404 })),
    );

    const response = await POST(createRequest({ repositoryUrl, commitSha }, "missing-commit"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "COMMIT_NOT_FOUND" } });
  });

  it("reports GitHub API rate limiting clearly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { message: "rate limit" },
          { status: 403, headers: { "x-ratelimit-remaining": "0" } },
        ),
      ),
    );

    const response = await POST(createRequest({ repositoryUrl, commitSha }, "github-rate-limit"));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "GITHUB_RATE_LIMIT" } });
  });
});

function createRequest(body: unknown, clientId: string) {
  return new Request("http://localhost/api/github/verify", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `test-${clientId}` },
    body: JSON.stringify(body),
  });
}

