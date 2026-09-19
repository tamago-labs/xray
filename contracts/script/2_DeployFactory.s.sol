// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {PerpFactory} from "../src/PerpFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("2_DeployFactory - X Layer Testnet");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        PerpFactory factory = new PerpFactory();

        console.log("PerpFactory deployed at:", address(factory));

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("Update .env:");
        console.log("FACTORY_ADDRESS=%s", address(factory));
        console.log("===========================================");

        console.log("\nNext: Run 3_CreateMarket.s.sol to create a market");
    }
}
