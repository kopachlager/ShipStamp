// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ShipStampRegistry
/// @author ShipStamp contributors
/// @notice Immutable, wallet-signed build receipts indexed by normalized GitHub repository.
/// @dev ShipStamp verifies the public GitHub commit and live deployment manifest offchain.
///      This registry independently checks the canonical manifest hash against msg.sender and
///      records that hash with the Monad block timestamp. It does not fetch deployments.
contract ShipStampRegistry {
    uint256 public constant MAX_PROJECT_LENGTH = 80;
    uint256 public constant MAX_REPOSITORY_LENGTH = 200;
    uint256 public constant COMMIT_SHA_LENGTH = 40;
    uint256 public constant MAX_DEPLOYMENT_URL_LENGTH = 2_048;
    uint256 public constant MAX_MILESTONE_LENGTH = 280;
    uint256 public constant MAX_SCHEMA_VERSION_LENGTH = 16;
    uint256 public constant MAX_PAGE_SIZE = 100;

    struct BuildStamp {
        uint256 id;
        address builder;
        string project;
        string repository;
        string commitSha;
        string deploymentUrl;
        string milestone;
        bytes32 manifestHash;
        string proofSchemaVersion;
        uint64 timestamp;
    }

    struct BuildStampInput {
        string project;
        string repository;
        string commitSha;
        string deploymentUrl;
        string milestone;
        bytes32 manifestHash;
        string proofSchemaVersion;
    }

    event BuildStamped(
        uint256 indexed stampId,
        address indexed builder,
        bytes32 indexed projectKey,
        bytes32 manifestHash,
        string proofSchemaVersion,
        uint64 timestamp
    );

    error StampNotFound(uint256 stampId);
    error EmptyProject();
    error ProjectTooLong(uint256 actualLength);
    error EmptyRepository();
    error RepositoryTooLong(uint256 actualLength);
    error InvalidCommitLength(uint256 actualLength);
    error EmptyDeploymentUrl();
    error DeploymentUrlTooLong(uint256 actualLength);
    error EmptyMilestone();
    error MilestoneTooLong(uint256 actualLength);
    error EmptyProofSchemaVersion();
    error ProofSchemaVersionTooLong(uint256 actualLength);
    error ManifestHashMismatch(bytes32 expected, bytes32 provided);
    error DuplicateStamp(bytes32 duplicateKey);
    error InvalidPageSize(uint256 requested);

    uint256 public totalStamps;

    mapping(uint256 stampId => BuildStamp stamp) private _stamps;
    mapping(bytes32 projectKey => uint256[] stampIds) private _projectStampIds;
    mapping(bytes32 duplicateKey => bool exists) private _duplicateKeys;

    /// @notice Records one verified build receipt for msg.sender.
    /// @dev The supplied manifest hash must equal keccak256(abi.encode(schemaVersion, project,
    ///      repository, commitSha, deploymentUrl, msg.sender)). A different milestone alone cannot
    ///      create another receipt for the same verified build.
    function stampBuild(BuildStampInput calldata input) external returns (uint256 stampId) {
        _validateInputs(input);

        bytes32 expectedManifestHash = computeManifestHash(
            input.proofSchemaVersion,
            input.project,
            input.repository,
            input.commitSha,
            input.deploymentUrl,
            msg.sender
        );
        if (input.manifestHash != expectedManifestHash) {
            revert ManifestHashMismatch(expectedManifestHash, input.manifestHash);
        }

        bytes32 duplicateKey = computeDuplicateKey(
            msg.sender, input.repository, input.commitSha, input.deploymentUrl, input.manifestHash
        );
        if (_duplicateKeys[duplicateKey]) revert DuplicateStamp(duplicateKey);

        stampId = ++totalStamps;
        uint64 timestamp = uint64(block.timestamp);
        bytes32 projectKey = computeProjectKey(input.repository);

        _stamps[stampId] = BuildStamp({
            id: stampId,
            builder: msg.sender,
            project: input.project,
            repository: input.repository,
            commitSha: input.commitSha,
            deploymentUrl: input.deploymentUrl,
            milestone: input.milestone,
            manifestHash: input.manifestHash,
            proofSchemaVersion: input.proofSchemaVersion,
            timestamp: timestamp
        });
        _projectStampIds[projectKey].push(stampId);
        _duplicateKeys[duplicateKey] = true;

        emit BuildStamped(
            stampId, msg.sender, projectKey, input.manifestHash, input.proofSchemaVersion, timestamp
        );
    }

    function getStamp(uint256 stampId) external view returns (BuildStamp memory stamp) {
        if (stampId == 0 || stampId > totalStamps) revert StampNotFound(stampId);
        return _stamps[stampId];
    }

    function getProjectStampCount(string calldata repository) external view returns (uint256) {
        return _projectStampIds[computeProjectKey(repository)].length;
    }

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

    function isDuplicate(
        address builder,
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl,
        bytes32 manifestHash
    ) external view returns (bool) {
        return _duplicateKeys[
            computeDuplicateKey(builder, repository, commitSha, deploymentUrl, manifestHash)
        ];
    }

    /// @notice Computes the canonical manifest hash enforced during receipt creation.
    function computeManifestHash(
        string calldata schemaVersion,
        string calldata project,
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl,
        address builder
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(schemaVersion, project, repository, commitSha, deploymentUrl, builder)
        );
    }

    function computeDuplicateKey(
        address builder,
        string calldata repository,
        string calldata commitSha,
        string calldata deploymentUrl,
        bytes32 manifestHash
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                builder,
                keccak256(bytes(repository)),
                keccak256(bytes(commitSha)),
                keccak256(bytes(deploymentUrl)),
                manifestHash
            )
        );
    }

    function computeProjectKey(string calldata repository) public pure returns (bytes32) {
        return keccak256(bytes(repository));
    }

    function _validateInputs(BuildStampInput calldata input) private pure {
        uint256 projectLength = bytes(input.project).length;
        if (projectLength == 0) revert EmptyProject();
        if (projectLength > MAX_PROJECT_LENGTH) revert ProjectTooLong(projectLength);

        uint256 repositoryLength = bytes(input.repository).length;
        if (repositoryLength == 0) revert EmptyRepository();
        if (repositoryLength > MAX_REPOSITORY_LENGTH) {
            revert RepositoryTooLong(repositoryLength);
        }

        uint256 commitLength = bytes(input.commitSha).length;
        if (commitLength != COMMIT_SHA_LENGTH) revert InvalidCommitLength(commitLength);

        uint256 deploymentLength = bytes(input.deploymentUrl).length;
        if (deploymentLength == 0) revert EmptyDeploymentUrl();
        if (deploymentLength > MAX_DEPLOYMENT_URL_LENGTH) {
            revert DeploymentUrlTooLong(deploymentLength);
        }

        uint256 milestoneLength = bytes(input.milestone).length;
        if (milestoneLength == 0) revert EmptyMilestone();
        if (milestoneLength > MAX_MILESTONE_LENGTH) revert MilestoneTooLong(milestoneLength);

        uint256 schemaVersionLength = bytes(input.proofSchemaVersion).length;
        if (schemaVersionLength == 0) revert EmptyProofSchemaVersion();
        if (schemaVersionLength > MAX_SCHEMA_VERSION_LENGTH) {
            revert ProofSchemaVersionTooLong(schemaVersionLength);
        }
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
