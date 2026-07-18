export const shipStampRegistryAbi = [
  {
    type: "function",
    name: "stampBuild",
    stateMutability: "nonpayable",
    inputs: [
      { name: "repository", type: "string" },
      { name: "commitSha", type: "string" },
      { name: "deploymentUrl", type: "string" },
      { name: "milestone", type: "string" },
      { name: "artifactHash", type: "bytes32" },
    ],
    outputs: [{ name: "stampId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getStamp",
    stateMutability: "view",
    inputs: [{ name: "stampId", type: "uint256" }],
    outputs: [
      {
        name: "stamp",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "builder", type: "address" },
          { name: "repository", type: "string" },
          { name: "commitSha", type: "string" },
          { name: "deploymentUrl", type: "string" },
          { name: "milestone", type: "string" },
          { name: "artifactHash", type: "bytes32" },
          { name: "timestamp", type: "uint64" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getProjectStampCount",
    stateMutability: "view",
    inputs: [{ name: "repository", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getProjectStamps",
    stateMutability: "view",
    inputs: [
      { name: "repository", type: "string" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "stamps",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "builder", type: "address" },
          { name: "repository", type: "string" },
          { name: "commitSha", type: "string" },
          { name: "deploymentUrl", type: "string" },
          { name: "milestone", type: "string" },
          { name: "artifactHash", type: "bytes32" },
          { name: "timestamp", type: "uint64" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "isDuplicate",
    stateMutability: "view",
    inputs: [
      { name: "builder", type: "address" },
      { name: "repository", type: "string" },
      { name: "commitSha", type: "string" },
      { name: "deploymentUrl", type: "string" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "BuildStamped",
    anonymous: false,
    inputs: [
      { name: "stampId", type: "uint256", indexed: true },
      { name: "builder", type: "address", indexed: true },
      { name: "projectKey", type: "bytes32", indexed: true },
      { name: "artifactHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false },
    ],
  },
] as const;

