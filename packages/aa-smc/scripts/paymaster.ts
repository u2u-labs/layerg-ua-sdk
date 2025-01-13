import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0x1E1633F78Ae50Ff506FF8712431aE6618B8E7D6B"
  const _verifyingSigner = "0x13ddb633924e5bC7C4F4983bCE25497e62F1e32D"

  const verifyingPaymaster = await ethers.deployContract("VerifyingPaymaster", [_entryPoint, _verifyingSigner]);
  await verifyingPaymaster.waitForDeployment();
  console.log(`Pay master pool deployed to ${verifyingPaymaster.target}`);
  const verifyingPaymasterContract = verifyingPaymaster.target

  try {
    await hre.run("verify:verify", {
      address: verifyingPaymasterContract,
      constructorArguments: [_entryPoint, _verifyingSigner],
    });
  } catch (error) {
    console.log('verifyingPaymasterContract: ', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Pay master pool deployed to 0xeA3f7a2356dc17146C36AeE01C785419Fc44f218