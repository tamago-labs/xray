// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// forge script script/1_DeployOracle.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

import {Script, console} from "forge-std/Script.sol";
import {PriceOracle} from "../src/PriceOracle.sol";

contract DeployOracle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        uint256 initialPrice = 990e18;
        uint256 staleness = type(uint256).max;
        uint256 updateDelay = 300;

        console.log("===========================================");
        console.log("1_DeployOracle - X Layer Testnet");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Initial Price:", initialPrice);
        console.log("Staleness:", staleness);
        console.log("Update Delay:", updateDelay);

        vm.startBroadcast(deployerPrivateKey);

        PriceOracle oracle = new PriceOracle(
            "OpenAI Pre-IPO",
            "OpenAI",
            initialPrice,
            staleness,
            updateDelay
        );

        console.log("PriceOracle deployed at:", address(oracle));

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("Update .env:");
        console.log("ORACLE_ADDRESS=%s", address(oracle));
        console.log("===========================================");

        console.log("\nUsage:");
        console.log("  Set price: oracle.updatePrice(newPrice) then confirmPriceUpdate()");
        console.log("  Bot address must be whitelisted: oracle.addToWhitelist(bot)");
    }
}
