// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// forge script script/3_CreateMarket.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

import {Script, console} from "forge-std/Script.sol";
import {PerpFactory} from "../src/PerpFactory.sol";

contract CreateMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        address oracleAddr = vm.envAddress("ORACLE_ADDRESS");

        string memory name = "OpenAI Pre-IPO Xray";
        string memory symbol = "OpenAI";
        uint256 initialMargin = 0.1e18;
        uint256 maintenanceMargin = 0.05e18;
        uint256 liquidationPenalty = 0.005e18;

        console.log("===========================================");
        console.log("3_CreateMarket - X Layer Testnet");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Factory:", factoryAddr);
        console.log("USDC:", usdcAddr);
        console.log("Oracle:", oracleAddr);
        console.log("Market: %s (%s)", name, symbol);

        PerpFactory factory = PerpFactory(factoryAddr);

        vm.startBroadcast(deployerPrivateKey);

        address perpetual = factory.createMarket(
            name,
            symbol,
            usdcAddr,
            oracleAddr,
            initialMargin,
            maintenanceMargin,
            liquidationPenalty
        );

        console.log("Perpetual deployed at:", address(perpetual));

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("Update .env:");
        console.log("PERPETUAL_ADDRESS=%s", address(perpetual));
        console.log("===========================================");

        console.log("\nNext: Run 4_InitializeMarket.s.sol to whitelist bot and add liquidity");
    }
}
