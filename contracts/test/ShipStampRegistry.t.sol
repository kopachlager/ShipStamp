// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { ShipStampRegistry } from "../src/ShipStampRegistry.sol";

contract ShipStampRegistryTest is Test {
    event BuildStamped(
        uint256 indexed stampId,
        address indexed builder,
        bytes32 indexed projectKey,
        bytes32 manifestHash,
        string proofSchemaVersion,
        uint64 timestamp
    );

    ShipStampRegistry internal registry;
    string internal constant SCHEMA = "1";
    string internal constant PROJECT = "ShipStamp";
    string internal constant REPOSITORY = "kopachlager/shipstamp";
    string internal constant OTHER_REPOSITORY = "kopachlager/another-project";
    string internal constant COMMIT_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    string internal constant COMMIT_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    string internal constant COMMIT_C = "cccccccccccccccccccccccccccccccccccccccc";
    string internal constant DEPLOYMENT = "https://shipstamp.example";
    string internal constant OTHER_DEPLOYMENT = "https://preview.shipstamp.example";
    string internal constant MILESTONE = "Manifest verification completed";
    address internal constant BUILDER = 0x000000000000000000000000000000000000B01D;
    address internal constant OTHER_BUILDER = 0x000000000000000000000000000000000000cafE;

    function setUp() public {
        registry = new ShipStampRegistry();
    }

    function testCreatesStampWithCorrectFields() public {
        vm.warp(1_726_123_456);
        vm.prank(BUILDER);
        uint256 stampId =
            _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, BUILDER);
        ShipStampRegistry.BuildStamp memory stamp = registry.getStamp(stampId);
        assertEq(stamp.id, 1);
        assertEq(stamp.builder, BUILDER);
        assertEq(stamp.project, PROJECT);
        assertEq(stamp.repository, REPOSITORY);
        assertEq(stamp.commitSha, COMMIT_A);
        assertEq(stamp.deploymentUrl, DEPLOYMENT);
        assertEq(stamp.milestone, MILESTONE);
        assertEq(
            stamp.manifestHash,
            _manifestHash(SCHEMA, PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, BUILDER)
        );
        assertEq(stamp.proofSchemaVersion, SCHEMA);
        assertEq(stamp.timestamp, 1_726_123_456);
    }

    function testEmitsManifestHashAndSchemaVersion() public {
        vm.warp(99_999);
        bytes32 manifestHash =
            _manifestHash(SCHEMA, PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, BUILDER);
        vm.expectEmit(true, true, true, true, address(registry));
        emit BuildStamped(1, BUILDER, keccak256(bytes(REPOSITORY)), manifestHash, SCHEMA, 99_999);
        vm.prank(BUILDER);
        registry.stampBuild(
            _input(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, manifestHash, SCHEMA)
        );
    }

    function testBuilderAlwaysEqualsTransactionSender() public {
        vm.prank(BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, BUILDER);
        assertEq(registry.getStamp(1).builder, BUILDER);
    }

    function testRejectsHashForArbitraryBuilder() public {
        bytes32 wrongHash =
            _manifestHash(SCHEMA, PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, OTHER_BUILDER);
        bytes32 expected = _manifestHash(SCHEMA, PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, BUILDER);
        vm.expectRevert(
            abi.encodeWithSelector(
                ShipStampRegistry.ManifestHashMismatch.selector, expected, wrongHash
            )
        );
        vm.prank(BUILDER);
        registry.stampBuild(
            _input(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, wrongHash, SCHEMA)
        );
    }

    function testIndexesAndRetrievesProjectStampsChronologically() public {
        vm.startPrank(BUILDER);
        vm.warp(100);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "First", SCHEMA, BUILDER);
        vm.warp(200);
        _stamp(PROJECT, REPOSITORY, COMMIT_B, DEPLOYMENT, "Second", SCHEMA, BUILDER);
        vm.warp(300);
        _stamp(PROJECT, REPOSITORY, COMMIT_C, DEPLOYMENT, "Third", SCHEMA, BUILDER);
        vm.stopPrank();
        ShipStampRegistry.BuildStamp[] memory stamps = registry.getProjectStamps(REPOSITORY, 0, 100);
        assertEq(stamps.length, 3);
        assertEq(stamps[0].id, 1);
        assertEq(stamps[1].id, 2);
        assertEq(stamps[2].id, 3);
        assertLt(stamps[0].timestamp, stamps[1].timestamp);
        assertLt(stamps[1].timestamp, stamps[2].timestamp);
    }

    function testPaginatesAndSeparatesProjects() public {
        vm.startPrank(BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "First", SCHEMA, BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_B, DEPLOYMENT, "Second", SCHEMA, BUILDER);
        _stamp("Other", OTHER_REPOSITORY, COMMIT_A, DEPLOYMENT, "Other", SCHEMA, BUILDER);
        vm.stopPrank();
        assertEq(registry.getProjectStampCount(REPOSITORY), 2);
        assertEq(registry.getProjectStampCount(OTHER_REPOSITORY), 1);
        assertEq(registry.getProjectStamps(REPOSITORY, 1, 1)[0].id, 2);
        assertEq(registry.getProjectStampIds(REPOSITORY, 2, 10).length, 0);
    }

    function testRejectsExactDuplicateWhenOnlyMilestoneChanges() public {
        bytes32 hash = _manifestHash(SCHEMA, PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, BUILDER);
        vm.startPrank(BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, BUILDER);
        bytes32 key = registry.computeDuplicateKey(BUILDER, REPOSITORY, COMMIT_A, DEPLOYMENT, hash);
        vm.expectRevert(abi.encodeWithSelector(ShipStampRegistry.DuplicateStamp.selector, key));
        registry.stampBuild(
            _input(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "Changed copy", hash, SCHEMA)
        );
        vm.stopPrank();
        assertTrue(registry.isDuplicate(BUILDER, REPOSITORY, COMMIT_A, DEPLOYMENT, hash));
    }

    function testAcceptsDifferentManifestHashWhenValid() public {
        vm.startPrank(BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, BUILDER);
        _stamp(
            "ShipStamp Next", REPOSITORY, COMMIT_A, DEPLOYMENT, "Project renamed", SCHEMA, BUILDER
        );
        vm.stopPrank();
        assertEq(registry.totalStamps(), 2);
    }

    function testAcceptsDifferentCommitDeploymentAndWallet() public {
        vm.startPrank(BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "First", SCHEMA, BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_B, DEPLOYMENT, "Commit", SCHEMA, BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, OTHER_DEPLOYMENT, "Deployment", SCHEMA, BUILDER);
        vm.stopPrank();
        vm.prank(OTHER_BUILDER);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "Wallet", SCHEMA, OTHER_BUILDER);
        assertEq(registry.totalStamps(), 4);
    }

    function testRejectsEmptyFields() public {
        vm.expectRevert(ShipStampRegistry.EmptyProject.selector);
        _stamp("", REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, address(this));
        vm.expectRevert(ShipStampRegistry.EmptyRepository.selector);
        _stamp(PROJECT, "", COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, address(this));
        vm.expectRevert(ShipStampRegistry.EmptyDeploymentUrl.selector);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, "", MILESTONE, SCHEMA, address(this));
        vm.expectRevert(ShipStampRegistry.EmptyMilestone.selector);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, "", SCHEMA, address(this));
        vm.expectRevert(ShipStampRegistry.EmptyProofSchemaVersion.selector);
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, "", address(this));
    }

    function testRejectsInvalidLengths() public {
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.ProjectTooLong.selector, uint256(81))
        );
        _stamp(_repeat("p", 81), REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, address(this));
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.RepositoryTooLong.selector, uint256(201))
        );
        _stamp(PROJECT, _repeat("r", 201), COMMIT_A, DEPLOYMENT, MILESTONE, SCHEMA, address(this));
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidCommitLength.selector, uint256(39))
        );
        _stamp(PROJECT, REPOSITORY, _repeat("a", 39), DEPLOYMENT, MILESTONE, SCHEMA, address(this));
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.DeploymentUrlTooLong.selector, uint256(2_049))
        );
        _stamp(PROJECT, REPOSITORY, COMMIT_A, _repeat("d", 2_049), MILESTONE, SCHEMA, address(this));
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.MilestoneTooLong.selector, uint256(281))
        );
        _stamp(PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, _repeat("m", 281), SCHEMA, address(this));
        vm.expectRevert(
            abi.encodeWithSelector(
                ShipStampRegistry.ProofSchemaVersionTooLong.selector, uint256(17)
            )
        );
        _stamp(
            PROJECT, REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, _repeat("1", 17), address(this)
        );
    }

    function testRejectsMissingStampAndInvalidPageSize() public {
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.StampNotFound.selector, uint256(0))
        );
        registry.getStamp(0);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidPageSize.selector, uint256(0))
        );
        registry.getProjectStamps(REPOSITORY, 0, 0);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidPageSize.selector, uint256(101))
        );
        registry.getProjectStampIds(REPOSITORY, 0, 101);
    }

    function testManifestHashMatchesFixedVector() public view {
        bytes32 expected = 0x3be7a36e7fd8bda04f33ac7373e5a90b49467021bc334b32580f373d70c3526d;
        assertEq(
            registry.computeManifestHash(
                SCHEMA,
                PROJECT,
                REPOSITORY,
                COMMIT_A,
                DEPLOYMENT,
                0x0000000000000000000000000000000000000001
            ),
            expected
        );
    }

    function _stamp(
        string memory project,
        string memory repository,
        string memory commitSha,
        string memory deploymentUrl,
        string memory milestone,
        string memory schema,
        address builder
    ) internal returns (uint256) {
        bytes32 hash = _manifestHash(schema, project, repository, commitSha, deploymentUrl, builder);
        return registry.stampBuild(
            _input(project, repository, commitSha, deploymentUrl, milestone, hash, schema)
        );
    }

    function _input(
        string memory project,
        string memory repository,
        string memory commitSha,
        string memory deploymentUrl,
        string memory milestone,
        bytes32 manifestHash,
        string memory schema
    ) internal pure returns (ShipStampRegistry.BuildStampInput memory) {
        return ShipStampRegistry.BuildStampInput({
                project: project,
                repository: repository,
                commitSha: commitSha,
                deploymentUrl: deploymentUrl,
                milestone: milestone,
                manifestHash: manifestHash,
                proofSchemaVersion: schema
            });
    }

    function _manifestHash(
        string memory schema,
        string memory project,
        string memory repository,
        string memory commitSha,
        string memory deploymentUrl,
        address builder
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(schema, project, repository, commitSha, deploymentUrl, builder));
    }

    function _repeat(bytes1 character, uint256 length) internal pure returns (string memory) {
        bytes memory result = new bytes(length);
        for (uint256 i; i < length; ++i) {
            result[i] = character;
        }
        return string(result);
    }
}
