import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0x06654388c0E9eCdbA6c8B187590041b6C909C86E"
  const _verifyingSigner = "0x13ddb633924e5bC7C4F4983bCE25497e62F1e32D"

  const VerifyingPaymaster = await ethers.getContractFactory("VerifyingPaymaster");
  const verifyingPaymaster = await VerifyingPaymaster.deploy(_entryPoint, _verifyingSigner); // Deploy the contract
  await verifyingPaymaster.deployed();
  console.log(`VerifyingPaymaster deployed to ${verifyingPaymaster.address}`);
  const verifyingPaymasterContract = verifyingPaymaster.address

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

// VerifyingPaymaster deployed to 0x031667b7B91BF06CA2C6aaE760308EEdD34bd6F4

// VerifyingPaymaster deployed to 0xe61F121cD0F4fAE6Fa3f6889539bc34dFa6F69C4