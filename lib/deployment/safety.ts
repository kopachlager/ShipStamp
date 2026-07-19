import dns from "node:dns/promises";
import { isIP } from "node:net";
import { normalizeDeploymentUrl } from "@/lib/artifact/normalization";
import { MANIFEST_PATH } from "@/lib/validation/constants";

export type AddressResolver = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

const defaultResolver: AddressResolver = async (hostname) =>
  dns.lookup(hostname, { all: true, verbatim: true });

export async function assertSafeDeploymentOrigin(
  input: string,
  resolver: AddressResolver = defaultResolver,
): Promise<string> {
  const origin = normalizeDeploymentUrl(input);
  const hostname = new URL(origin).hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) throw new Error("UNSAFE_DEPLOYMENT_URL");

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await resolver(hostname);
  } catch {
    throw new Error("UNSAFE_DEPLOYMENT_URL");
  }
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("UNSAFE_DEPLOYMENT_URL");
  }
  return origin;
}

export function getManifestUrl(origin: string): string {
  return `${origin}${MANIFEST_PATH}`;
}

export function validateManifestRedirect(currentUrl: string, location: string): URL {
  const redirected = new URL(location, currentUrl);
  if (
    redirected.protocol !== "https:" ||
    redirected.username ||
    redirected.password ||
    redirected.port ||
    redirected.pathname !== MANIFEST_PATH ||
    redirected.search ||
    redirected.hash
  ) {
    throw new Error("UNSAFE_DEPLOYMENT_URL");
  }
  return redirected;
}

export function isPublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPublicIp(normalized.slice(7));
    }
    return !(
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff")
    );
  }
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "metadata.google.internal" ||
    normalized === "metadata" ||
    normalized === "instance-data.ec2.internal"
  );
}
