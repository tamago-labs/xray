// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// forge script script/5_MintTokens.s.sol --rpc-url $XLAYER_RPC --broadcast

import {Script, console} from "forge-std/Script.sol";
import {ERC20Mock} from "../src/mocks/ERC20Mock.sol";

contract MintTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address usdcAddr = vm.envAddress("USDC_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 amount = vm.envUint("AMOUNT");

        console.log("===========================================");
        console.log("5_MintTokens - X Layer Testnet");
        console.log("===========================================");
        console.log("USDC:", usdcAddr);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);

        ERC20Mock usdc = ERC20Mock(usdcAddr);

        vm.startBroadcast(deployerPrivateKey);

        usdc.mint(recipient, amount);
        console.log("Minted %s USDC to %s", amount, recipient);

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("Done. Recipient balance: %s", usdc.balanceOf(recipient));
        console.log("===========================================");
    }
}
