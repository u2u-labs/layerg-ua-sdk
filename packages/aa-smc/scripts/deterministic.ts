import { ethers } from "hardhat";
import hre from "hardhat";
import { deployEntryPoint, deployFactoryAccount } from "@layerg-ua-sdk/aa-utils"

async function main() {
    // Get the first signer from the connected accounts
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // // Deploy EntryPoint
    // const entryPoint = await deployEntryPoint(deployer.provider)
    // console.log("Entrypoint deployed address: ", entryPoint.address);

    // Deploy factory
    const fatoryAccount = await deployFactoryAccount(deployer.provider)
    console.log("Factory deployed address: ", fatoryAccount.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Entrypoint deployed address:  0x803Cf2b820bcE4774DdfeB5CA13169Ef96fAc0d7
// Factory deployed address:  0xF7d8a53eb5359b7DcD17AD98D4a89C866Eee682f

// npx hardhat verify --network a8Testnet 0xF7d8a53eb5359b7DcD17AD98D4a89C866Eee682f 0x556180984Ec8B4d28476376f99A071042f262a5c 0x803Cf2b820bcE4774DdfeB5CA13169Ef96fAc0d7