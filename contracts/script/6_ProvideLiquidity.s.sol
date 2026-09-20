// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// forge script script/6_ProvideLiquidity.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

import {Script, console} from "forge-std/Script.sol";
import {PerpAMM} from "../src/PerpAMM.sol";
import {Perpetual} from "../src/Perpetual.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract ProvideLiquidity is Script {
    function run() external {
        uint256 lpPrivateKey = vm.envUint("PRIVATE_KEY");
        address lp = vm.addr(lpPrivateKey);

        address perpetualAddr = vm.envAddress("PERPETUAL_ADDRESS");
        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        uint256 amount = 10000e6;

        console.log("===========================================");
        console.log("6_ProvideLiquidity - X Layer Testnet");
        console.log("===========================================");
        console.log("LP:", lp);
        console.log("Perpetual:", perpetualAddr);
        console.log("Liquidity:", amount);

        Perpetual perpetual = Perpetual(perpetualAddr);
        PerpAMM amm = PerpAMM(perpetual.amm());
        IERC20 usdc = IERC20(usdcAddr);
        address ammAddr = address(amm);
        address lpTokenAddr = amm.lpToken();

        vm.startBroadcast(lpPrivateKey);

        usdc.approve(ammAddr, amount);
        console.log("Approved AMM to spend %s USDC", amount);

        IERC20 lpToken = IERC20(lpTokenAddr);
        uint256 totalShares = lpToken.totalSupply();

        if (totalShares == 0) {
            amm.initializePool(amount);
            console.log("Initialized pool with %s USDC", amount);
        } else {
            amm.addLiquidity(amount);
            console.log("Added %s USDC to pool", amount);
        }

        vm.stopBroadcast();

        uint256 lpShares = lpToken.balanceOf(lp);
        console.log("===========================================");
        console.log("LP shares received: %s", lpShares);
        console.log("===========================================");
    }
}
