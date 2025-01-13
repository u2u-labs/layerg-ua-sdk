import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const entryPoint = await ethers.deployContract("EntryPoint", []);
  await entryPoint.waitForDeployment();
  console.log(`Entrypoint deployed to ${entryPoint.target}`);
  const entryPointContract = entryPoint.target

  try {
    await hre.run("verify:verify", {
      address: entryPointContract,
      constructorArguments: [],
    });
  } catch (error) {
    console.log('entryPointContract: ', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Entrypoint deployed to 0x1E1633F78Ae50Ff506FF8712431aE6618B8E7D6B