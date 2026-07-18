// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ShipStampRegistry
/// @author ShipStamp contributors
/// @notice Immutable, wallet-signed build claims indexed by normalized GitHub repository.
/// @dev Callers must submit canonical strings. The registry enforces essential lengths,
///      recomputes the artifact hash, and prevents exact builder/repository/commit/deployment
///      duplicates. URL and hexadecimal syntax validation belongs to the application layer.
contract ShipStampRegistry {
    uint256 public constant MAX_REPOSITORY_LENGTH = 200;
    uint256 public constant COMMIT_SHA_LENGTH = 40;
    uint256 public constant MAX_DEPLOYMENT_URL_LENGTH = 2_048;
    uint256 public constant MAX_MILESTONE_LENGTH = 280;
    uint256 public constant MAX_PAGE_SIZE = 100;

    /// @notice A single immutable build claim.
    /// @param id Sequential identifier, beginning at one.
    /// @param builder Wallet that submitted the claim.
    /// @param repository Canonical lowercase `owner/repository` identifier.
    /// @param commitSha Canonical lowercase, full 40-character Git commit SHA.
    /// @param deploymentUrl Canonical HTTPS deployment URL.
    /// @param milestone Builder-supplied description of what was shipped.
    /// @param artifactHash Keccak-256 hash of the canonical artifact input.
    /// @param timestamp Monad block timestamp at creation.
    struct BuildStamp {
        uint256 id;
        address builder;
        string repository;
        string commitSha;
        string deploymentUrl;
        string milestone;
        bytes32 artifactHash;
        uint64 timestamp;
    }

    /// @notice Emitted after a build claim has been stored.
    /// @param stampId Sequential stamp identifier.
    /// @param builder Wallet that submitted the claim.
    /// @param projectKey Keccak-256 hash of the normalized repository identifier.
    /// @param artifactHash Canonical artifact hash.
    /// @param timestamp Monad block timestamp at creation.
    event BuildStamped(
        uint256 indexed stampId,
        address indexed builder,
        bytes32 indexed projectKey,
        bytes32 artifactHash,
        uint64 timestamp
    );

    error StampNotFound(uint256 stampId);
    error EmptyRepository();
    error RepositoryTooLong(uint256 actualLength);
    error InvalidCommitLength(uint256 actualLength);
    error EmptyDeploymentUrl();
    error DeploymentUrlTooLong(uint256 actualLength);
    error EmptyMilestone();
    error MilestoneTooLong(uint256 actualLength);
    error ArtifactHashMismatch(bytes32 expected, bytes32 provided);
    error DuplicateStamp(bytes32 duplicateKey);
    error InvalidPageSize(uint256 requested);

    uint256 public totalStamps;

    mapping(uint256 stampId => BuildStamp stamp) private _stamps;
    mapping(bytes32 projectKey => uint256[] stampIds) private _projectStampIds;
    mapping(bytes32 duplicateKey => bool exists) private _duplicateKeys;

    /// @notice Records one build claim for the caller.
    /// @dev The artifact hash must equal `keccak256(bytes(repository + ":" + commitSha + ":"
    ///      + deploymentUrl))`. Reverts when this caller has already stamped the same canonical
    ///      repository, commit, and deployment URL.
    /// @param repository Canonical lowercase `owner/repository` identifier.
    /// @param commitSha Canonical lowercase full Git commit SHA.
    /// @param deploymentUrl Canonical HTTPS deployment URL.
    /// @param milestone Description of this genuine build milestone.
    /// @param artifactHash Keccak-256 hash of the canonical artifact input.
    /// @return stampId Newly created sequential stamp identifier.
    function stampBuild(
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl,
        string calldata milestone,
        bytes32 artifactHash
    ) external returns (uint256 stampId) {
        _validateInputs(repository, commitSha, deploymentUrl, milestone);

        bytes32 expectedArtifactHash = computeArtifactHash(repository, commitSha, deploymentUrl);
        if (artifactHash != expectedArtifactHash) {
            revert ArtifactHashMismatch(expectedArtifactHash, artifactHash);
        }

        bytes32 duplicateKey = computeDuplicateKey(msg.sender, repository, commitSha, deploymentUrl);
        if (_duplicateKeys[duplicateKey]) revert DuplicateStamp(duplicateKey);

        stampId = ++totalStamps;
        uint64 timestamp = uint64(block.timestamp);
        bytes32 projectKey = computeProjectKey(repository);

        _stamps[stampId] = BuildStamp({
            id: stampId,
            builder: msg.sender,
            repository: repository,
            commitSha: commitSha,
            deploymentUrl: deploymentUrl,
            milestone: milestone,
            artifactHash: artifactHash,
            timestamp: timestamp
        });
        _projectStampIds[projectKey].push(stampId);
        _duplicateKeys[duplicateKey] = true;

        emit BuildStamped(stampId, msg.sender, projectKey, artifactHash, timestamp);
    }

    /// @notice Retrieves a build stamp by its sequential ID.
    /// @param stampId Existing stamp identifier.
    /// @return stamp Stored immutable build claim.
    function getStamp(uint256 stampId) external view returns (BuildStamp memory stamp) {
        if (stampId == 0 || stampId > totalStamps) revert StampNotFound(stampId);
        return _stamps[stampId];
    }

    /// @notice Returns the total stamps recorded for one normalized repository.
    /// @param repository Canonical lowercase `owner/repository` identifier.
    function getProjectStampCount(string calldata repository) external view returns (uint256) {
        return _projectStampIds[computeProjectKey(repository)].length;
    }

    /// @notice Retrieves chronological stamp IDs for a normalized repository.
    /// @param repository Canonical lowercase `owner/repository` identifier.
    /// @param offset Zero-based index into this project's stamps.
    /// @param limit Maximum number of IDs, from one through `MAX_PAGE_SIZE`.
    function getProjectStampIds(string calldata repository, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory ids)
    {
        uint256[] storage storedIds = _projectStampIds[computeProjectKey(repository)];
        (uint256 start, uint256 resultLength) = _page(storedIds.length, offset, limit);
        ids = new uint256[](resultLength);

        for (uint256 i; i < resultLength; ++i) {
            ids[i] = storedIds[start + i];
        }
    }

    /// @notice Retrieves chronological build stamps for a normalized repository.
    /// @param repository Canonical lowercase `owner/repository` identifier.
    /// @param offset Zero-based index into this project's stamps.
    /// @param limit Maximum number of stamps, from one through `MAX_PAGE_SIZE`.
    function getProjectStamps(string calldata repository, uint256 offset, uint256 limit)
        external
        view
        returns (BuildStamp[] memory stamps)
    {
        uint256[] storage storedIds = _projectStampIds[computeProjectKey(repository)];
        (uint256 start, uint256 resultLength) = _page(storedIds.length, offset, limit);
        stamps = new BuildStamp[](resultLength);

        for (uint256 i; i < resultLength; ++i) {
            stamps[i] = _stamps[storedIds[start + i]];
        }
    }

    /// @notice Reports whether a builder/repository/commit/deployment combination exists.
    function isDuplicate(
        address builder,
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl
    ) external view returns (bool) {
        return _duplicateKeys[computeDuplicateKey(builder, repository, commitSha, deploymentUrl)];
    }

    /// @notice Computes the canonical artifact hash enforced during creation.
    function computeArtifactHash(string calldata repository, string calldata commitSha, string calldata deploymentUrl)
        public
        pure
        returns (bytes32)
    {
        return keccak256(bytes(string.concat(repository, ":", commitSha, ":", deploymentUrl)));
    }

    /// @notice Computes the exact-duplicate key enforced during creation.
    function computeDuplicateKey(
        address builder,
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                builder, keccak256(bytes(repository)), keccak256(bytes(commitSha)), keccak256(bytes(deploymentUrl))
            )
        );
    }

    /// @notice Computes the project index key for a normalized repository.
    function computeProjectKey(string calldata repository) public pure returns (bytes32) {
        return keccak256(bytes(repository));
    }

    function _validateInputs(
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl,
        string calldata milestone
    ) private pure {
        uint256 repositoryLength = bytes(repository).length;
        if (repositoryLength == 0) revert EmptyRepository();
        if (repositoryLength > MAX_REPOSITORY_LENGTH) {
            revert RepositoryTooLong(repositoryLength);
        }

        uint256 commitLength = bytes(commitSha).length;
        if (commitLength != COMMIT_SHA_LENGTH) revert InvalidCommitLength(commitLength);

        uint256 deploymentLength = bytes(deploymentUrl).length;
        if (deploymentLength == 0) revert EmptyDeploymentUrl();
        if (deploymentLength > MAX_DEPLOYMENT_URL_LENGTH) {
            revert DeploymentUrlTooLong(deploymentLength);
        }

        uint256 milestoneLength = bytes(milestone).length;
        if (milestoneLength == 0) revert EmptyMilestone();
        if (milestoneLength > MAX_MILESTONE_LENGTH) revert MilestoneTooLong(milestoneLength);
    }

    function _page(uint256 total, uint256 offset, uint256 limit)
        private
        pure
        returns (uint256 start, uint256 resultLength)
    {
        if (limit == 0 || limit > MAX_PAGE_SIZE) revert InvalidPageSize(limit);
        if (offset >= total) return (total, 0);

        uint256 remaining = total - offset;
        return (offset, remaining < limit ? remaining : limit);
    }
}
