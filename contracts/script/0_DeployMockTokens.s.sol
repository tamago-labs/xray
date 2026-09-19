// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {ERC20Mock} from "../src/mocks/ERC20Mock.sol";

// forge script script/0_DeployMockTokens.s.sol --rpc-url $XLAYER_RPC --broadcast

contract DeployMockTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("0_DeployMockTokens - X Layer Testnet");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        ERC20Mock usdc = new ERC20Mock("USD Coin", "USDC", 6);
        console.log("USDC (6) deployed at:", address(usdc));

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("Update .env:");
        console.log("USDC_ADDRESS=%s", address(usdc));
        console.log("===========================================");
    }
}
