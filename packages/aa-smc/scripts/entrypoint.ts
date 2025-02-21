import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  // let tx;
  // const EntryPoint = await ethers.getContractFactory("EntryPoint");
  // const entryPoint = await EntryPoint.deploy(); // Deploy the contract
  // await entryPoint.deployed();
  // console.log(`Entrypoint deployed to ${entryPoint.address}`);
  // const entryPointContract = entryPoint.address
  const entryPointContract = "0x803Cf2b820bcE4774DdfeB5CA13169Ef96fAc0d7"

  // // Deploy G account factory
  // const _defaultAdmin = "0x556180984Ec8B4d28476376f99A071042f262a5c"
  // const GAccountFactory = await ethers.getContractFactory("GAccountFactory");
  // const gAccountFactory = await GAccountFactory.deploy(_defaultAdmin, entryPointContract); // Deploy the contract
  // await gAccountFactory.deployed();
  // console.log(`GAccountFactory deployed to ${gAccountFactory.address}`);
  // const gAccountFactoryContract = gAccountFactory.address


  // Deploy verifying paymaster
  const _verifyingSigner = "0x13ddb633924e5bC7C4F4983bCE25497e62F1e32D"
  const VerifyingPaymaster = await ethers.getContractFactory("VerifyingPaymaster");
  const verifyingPaymaster = await VerifyingPaymaster.deploy(entryPointContract, _verifyingSigner); // Deploy the contract
  await verifyingPaymaster.deployed();
  console.log(`VerifyingPaymaster deployed to ${verifyingPaymaster.address}`);
  const verifyingPaymasterContract = verifyingPaymaster.address

  // try {
  //   await hre.run("verify:verify", {
  //     address: entryPointContract,
  //     constructorArguments: [],
  //   });
  // } catch (error) {
  //   console.log('entryPointContract: ', error);
  // }

  // try {
  //   await hre.run("verify:verify", {
  //     address: gAccountFactoryContract,
  //     constructorArguments: [_defaultAdmin, entryPointContract],
  //   });
  // } catch (error) {
  //   console.log('GAccountFactory: ', error);
  // }

  try {
    await hre.run("verify:verify", {
      address: verifyingPaymasterContract,
      constructorArguments: [entryPointContract, _verifyingSigner],
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


// Entrypoint deployed to 0x704d254e4D7Dd9C806332A9508186baf1065BE82
// GAccountFactory deployed to 0xA5C90BcA05F01518B483fD2A3aAB253f7ce5D3db
// VerifyingPaymaster deployed to 0xba4774d6474e5dA24Eb74641243Ca794C9918e24

// npx hardhat verify --network nebulas 0x803Cf2b820bcE4774DdfeB5CA13169Ef96fAc0d7 0xBBF92F72a4627CEc4517aAcD817144014a8f64D8 0x9aEfB3a61787d30f33B4049382647e1D85Eb50EB