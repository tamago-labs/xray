// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// forge script script/4_InitializeMarket.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

import {Script, console} from "forge-std/Script.sol";
import {Perpetual} from "../src/Perpetual.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract InitializeMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address perpetualAddr = vm.envAddress("PERPETUAL_ADDRESS");
        address oracleAddr = vm.envAddress("ORACLE_ADDRESS");
        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        address botAddr = vm.envAddress("BOT_ADDRESS");
        address lpAddr = vm.envAddress("LP_ADDRESS");

        uint256 liquidityAmount = vm.envUint("LIQUIDITY_AMOUNT");

        console.log("===========================================");
        console.log("4_InitializeMarket - X Layer Testnet");
        console.log("===========================================");
        console.log("Perpetual:", perpetualAddr);
        console.log("Bot:", botAddr);
        console.log("LP:", lpAddr);
        console.log("Liquidity:", liquidityAmount);

        Perpetual perpetual = Perpetual(perpetualAddr);
        PriceOracle oracle = PriceOracle(oracleAddr);
        IERC20 usdc = IERC20(usdcAddr);
        address ammAddr = address(perpetual.amm());

        vm.startBroadcast(deployerPrivateKey);

        oracle.addToWhitelist(botAddr);
        console.log("Bot whitelisted in oracle");

        usdc.approve(ammAddr, liquidityAmount);

        vm.stopBroadcast();

        console.log("\nLP must call amm.initializePool() directly:");
        console.log("  amm.initializePool(", liquidityAmount, ")");
        console.log("  From address:", lpAddr);
        console.log("  AMM address:", ammAddr);

        console.log("\nBot must set initial price:");
        console.log("  oracle.updatePrice(initialPrice)");
        console.log("  Wait UPDATE_DELAY then oracle.confirmPriceUpdate()");

        console.log("\n===========================================");
        console.log("Market ready for trading!");
        console.log("===========================================");
    }
}
