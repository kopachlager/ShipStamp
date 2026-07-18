import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NetworkIndicator } from "./NetworkIndicator";

const accountState = vi.hoisted(() => ({ isConnected: false, chainId: undefined as number | undefined }));

vi.mock("wagmi", () => ({
  useAccount: () => accountState,
}));

describe("NetworkIndicator", () => {
  beforeEach(() => {
    accountState.isConnected = false;
    accountState.chainId = undefined;
  });

  it("shows the disconnected state", () => {
    render(<NetworkIndicator />);
    expect(screen.getByText("Wallet disconnected")).toBeInTheDocument();
  });

  it("shows a wrong-network state", () => {
    accountState.isConnected = true;
    accountState.chainId = 1;
    render(<NetworkIndicator />);
    expect(screen.getByText("Wrong network")).toBeInTheDocument();
  });

  it("recognizes Monad Testnet", () => {
    accountState.isConnected = true;
    accountState.chainId = 10_143;
    render(<NetworkIndicator />);
    expect(screen.getByText("Monad Testnet")).toBeInTheDocument();
  });
});

