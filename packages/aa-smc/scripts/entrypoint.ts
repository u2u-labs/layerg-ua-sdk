import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy(); // Deploy the contract
  await entryPoint.deployed();
  console.log(`Entrypoint deployed to ${entryPoint.address}`);
  const entryPointContract = entryPoint.address

  // try {
  //   await hre.run("verify:verify", {
  //     address: entryPointContract,
  //     constructorArguments: [],
  //   });
  // } catch (error) {
  //   console.log('entryPointContract: ', error);
  // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Entrypoint deployed to 0x21c109Ef937FD9e1bFb18cD96393aC99f0165232