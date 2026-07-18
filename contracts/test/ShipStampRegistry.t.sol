// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { ShipStampRegistry } from "../src/ShipStampRegistry.sol";

contract ShipStampRegistryTest is Test {
    event BuildStamped(
        uint256 indexed stampId,
        address indexed builder,
        bytes32 indexed projectKey,
        bytes32 artifactHash,
        uint64 timestamp
    );

    ShipStampRegistry internal registry;

    string internal constant REPOSITORY = "kopachlager/shipstamp";
    string internal constant OTHER_REPOSITORY = "kopachlager/another-project";
    string internal constant COMMIT_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    string internal constant COMMIT_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    string internal constant COMMIT_C = "cccccccccccccccccccccccccccccccccccccccc";
    string internal constant DEPLOYMENT = "https://shipstamp.example";
    string internal constant OTHER_DEPLOYMENT = "https://preview.shipstamp.example/release";
    string internal constant MILESTONE = "Contract registry implemented";

    address internal constant BUILDER = address(0xB01D);
    address internal constant OTHER_BUILDER = address(0xCAFE);

    function setUp() public {
        registry = new ShipStampRegistry();
    }

    function testCreatesStampWithCorrectFields() public {
        vm.warp(1_726_123_456);
        bytes32 artifactHash = _artifactHash(REPOSITORY, COMMIT_A, DEPLOYMENT);

        vm.prank(BUILDER);
        uint256 stampId =
            registry.stampBuild(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, artifactHash);

        ShipStampRegistry.BuildStamp memory stamp = registry.getStamp(stampId);
        assertEq(stamp.id, 1);
        assertEq(stamp.builder, BUILDER);
        assertEq(stamp.repository, REPOSITORY);
        assertEq(stamp.commitSha, COMMIT_A);
        assertEq(stamp.deploymentUrl, DEPLOYMENT);
        assertEq(stamp.milestone, MILESTONE);
        assertEq(stamp.artifactHash, artifactHash);
        assertEq(stamp.timestamp, 1_726_123_456);
        assertEq(registry.totalStamps(), 1);
    }

    function testEmitsBuildStampedEvent() public {
        vm.warp(1_726_123_456);
        bytes32 artifactHash = _artifactHash(REPOSITORY, COMMIT_A, DEPLOYMENT);
        bytes32 projectKey = keccak256(bytes(REPOSITORY));

        vm.expectEmit(true, true, true, true, address(registry));
        emit BuildStamped(1, BUILDER, projectKey, artifactHash, 1_726_123_456);

        vm.prank(BUILDER);
        registry.stampBuild(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, artifactHash);
    }

    function testUsesCallerAsBuilder() public {
        vm.prank(BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);

        assertEq(registry.getStamp(1).builder, BUILDER);
    }

    function testAssignsCurrentBlockTimestamp() public {
        vm.warp(99_999);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);

        assertEq(registry.getStamp(1).timestamp, 99_999);
    }

    function testIndexesAndRetrievesProjectStampsChronologically() public {
        vm.warp(100);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "First");
        vm.warp(200);
        _stamp(REPOSITORY, COMMIT_B, DEPLOYMENT, "Second");
        vm.warp(300);
        _stamp(REPOSITORY, COMMIT_C, DEPLOYMENT, "Third");

        assertEq(registry.getProjectStampCount(REPOSITORY), 3);

        uint256[] memory ids = registry.getProjectStampIds(REPOSITORY, 0, 100);
        assertEq(ids.length, 3);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
        assertEq(ids[2], 3);

        ShipStampRegistry.BuildStamp[] memory stamps = registry.getProjectStamps(REPOSITORY, 0, 100);
        assertEq(stamps.length, 3);
        assertEq(stamps[0].milestone, "First");
        assertEq(stamps[1].milestone, "Second");
        assertEq(stamps[2].milestone, "Third");
        assertLt(stamps[0].timestamp, stamps[1].timestamp);
        assertLt(stamps[1].timestamp, stamps[2].timestamp);
    }

    function testPaginatesProjectStamps() public {
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "First");
        _stamp(REPOSITORY, COMMIT_B, DEPLOYMENT, "Second");
        _stamp(REPOSITORY, COMMIT_C, DEPLOYMENT, "Third");

        ShipStampRegistry.BuildStamp[] memory stamps = registry.getProjectStamps(REPOSITORY, 1, 1);
        assertEq(stamps.length, 1);
        assertEq(stamps[0].id, 2);

        uint256[] memory emptyPage = registry.getProjectStampIds(REPOSITORY, 3, 10);
        assertEq(emptyPage.length, 0);
    }

    function testSeparatesMultipleProjects() public {
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "ShipStamp milestone");
        _stamp(OTHER_REPOSITORY, COMMIT_A, DEPLOYMENT, "Other project milestone");

        assertEq(registry.totalStamps(), 2);
        assertEq(registry.getProjectStampCount(REPOSITORY), 1);
        assertEq(registry.getProjectStampCount(OTHER_REPOSITORY), 1);
        assertEq(registry.getProjectStampIds(REPOSITORY, 0, 10)[0], 1);
        assertEq(registry.getProjectStampIds(OTHER_REPOSITORY, 0, 10)[0], 2);
    }

    function testRejectsExactDuplicate() public {
        vm.startPrank(BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);

        bytes32 duplicateKey =
            registry.computeDuplicateKey(BUILDER, REPOSITORY, COMMIT_A, DEPLOYMENT);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.DuplicateStamp.selector, duplicateKey)
        );
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "A different description");
        vm.stopPrank();

        assertTrue(registry.isDuplicate(BUILDER, REPOSITORY, COMMIT_A, DEPLOYMENT));
        assertEq(registry.totalStamps(), 1);
    }

    function testAcceptsNewCommitForSameProject() public {
        vm.startPrank(BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "First");
        _stamp(REPOSITORY, COMMIT_B, DEPLOYMENT, "Second");
        vm.stopPrank();

        assertEq(registry.getProjectStampCount(REPOSITORY), 2);
    }

    function testAcceptsNewDeploymentForSameCommit() public {
        vm.startPrank(BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "Production");
        _stamp(REPOSITORY, COMMIT_A, OTHER_DEPLOYMENT, "Preview");
        vm.stopPrank();

        assertEq(registry.getProjectStampCount(REPOSITORY), 2);
    }

    function testAcceptsDifferentBuilderForSameArtifact() public {
        vm.prank(BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);
        vm.prank(OTHER_BUILDER);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);

        assertEq(registry.getProjectStampCount(REPOSITORY), 2);
        assertEq(registry.getStamp(1).builder, BUILDER);
        assertEq(registry.getStamp(2).builder, OTHER_BUILDER);
    }

    function testRejectsEmptyRepository() public {
        vm.expectRevert(ShipStampRegistry.EmptyRepository.selector);
        _stamp("", COMMIT_A, DEPLOYMENT, MILESTONE);
    }

    function testRejectsEmptyCommit() public {
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidCommitLength.selector, uint256(0))
        );
        _stamp(REPOSITORY, "", DEPLOYMENT, MILESTONE);
    }

    function testRejectsEmptyDeployment() public {
        vm.expectRevert(ShipStampRegistry.EmptyDeploymentUrl.selector);
        _stamp(REPOSITORY, COMMIT_A, "", MILESTONE);
    }

    function testRejectsEmptyMilestone() public {
        vm.expectRevert(ShipStampRegistry.EmptyMilestone.selector);
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, "");
    }

    function testRejectsRepositoryOverMaximumLength() public {
        string memory repository = _repeat("r", 201);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.RepositoryTooLong.selector, uint256(201))
        );
        _stamp(repository, COMMIT_A, DEPLOYMENT, MILESTONE);
    }

    function testRejectsCommitWithInvalidLength() public {
        string memory shortCommit = _repeat("a", 39);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidCommitLength.selector, uint256(39))
        );
        _stamp(REPOSITORY, shortCommit, DEPLOYMENT, MILESTONE);

        string memory longCommit = _repeat("a", 41);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidCommitLength.selector, uint256(41))
        );
        _stamp(REPOSITORY, longCommit, DEPLOYMENT, MILESTONE);
    }

    function testRejectsDeploymentOverMaximumLength() public {
        string memory deployment = _repeat("d", 2_049);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.DeploymentUrlTooLong.selector, uint256(2_049))
        );
        _stamp(REPOSITORY, COMMIT_A, deployment, MILESTONE);
    }

    function testRejectsMilestoneOverMaximumLength() public {
        string memory milestone = _repeat("m", 281);
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.MilestoneTooLong.selector, uint256(281))
        );
        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, milestone);
    }

    function testStoresCorrectArtifactHash() public {
        bytes32 expected =
            keccak256(bytes(string.concat(REPOSITORY, ":", COMMIT_A, ":", DEPLOYMENT)));
        assertEq(registry.computeArtifactHash(REPOSITORY, COMMIT_A, DEPLOYMENT), expected);

        _stamp(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE);
        assertEq(registry.getStamp(1).artifactHash, expected);
    }

    function testRejectsIncorrectArtifactHash() public {
        bytes32 expected = _artifactHash(REPOSITORY, COMMIT_A, DEPLOYMENT);
        bytes32 provided = bytes32(uint256(123));
        vm.expectRevert(
            abi.encodeWithSelector(
                ShipStampRegistry.ArtifactHashMismatch.selector, expected, provided
            )
        );
        registry.stampBuild(REPOSITORY, COMMIT_A, DEPLOYMENT, MILESTONE, provided);
    }

    function testRejectsMissingStamp() public {
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.StampNotFound.selector, uint256(0))
        );
        registry.getStamp(0);

        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.StampNotFound.selector, uint256(1))
        );
        registry.getStamp(1);
    }

    function testRejectsInvalidPageSize() public {
        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidPageSize.selector, uint256(0))
        );
        registry.getProjectStamps(REPOSITORY, 0, 0);

        vm.expectRevert(
            abi.encodeWithSelector(ShipStampRegistry.InvalidPageSize.selector, uint256(101))
        );
        registry.getProjectStampIds(REPOSITORY, 0, 101);
    }

    function _stamp(
        string memory repository,
        string memory commitSha,
        string memory deploymentUrl,
        string memory milestone
    ) internal returns (uint256) {
        return registry.stampBuild(
            repository,
            commitSha,
            deploymentUrl,
            milestone,
            _artifactHash(repository, commitSha, deploymentUrl)
        );
    }

    function _artifactHash(
        string memory repository,
        string memory commitSha,
        string memory deploymentUrl
    ) internal pure returns (bytes32) {
        return keccak256(bytes(string.concat(repository, ":", commitSha, ":", deploymentUrl)));
    }

    function _repeat(bytes1 character, uint256 length) internal pure returns (string memory) {
        bytes memory result = new bytes(length);
        for (uint256 i; i < length; ++i) {
            result[i] = character;
        }
        return string(result);
    }
}
