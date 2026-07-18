// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { ShipStampRegistry } from "../src/ShipStampRegistry.sol";

/// @notice Deploys the immutable ShipStamp registry with no constructor arguments.
contract DeployShipStamp is Script {
    function run() external returns (ShipStampRegistry registry) {
        vm.startBroadcast();
        registry = new ShipStampRegistry();
        vm.stopBroadcast();
    }
}

