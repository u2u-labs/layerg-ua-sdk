import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0xd46FF3b330Ee924E4457fbe1c1ed7db5646f023C"
  const _defaultAdmin = "0x556180984Ec8B4d28476376f99A071042f262a5c"
  const GAccountFactory = await ethers.getContractFactory("GAccountFactory");
  const gAccountFactory = await GAccountFactory.deploy(_defaultAdmin, _entryPoint); // Deploy the contract
  await gAccountFactory.deployed();
  console.log(`GAccountFactory deployed to ${gAccountFactory.address}`);
  const gAccountFactoryContract = gAccountFactory.address

  try {
    await hre.run("verify:verify", {
      address: gAccountFactoryContract,
      constructorArguments: [_defaultAdmin, _entryPoint],
    });
  } catch (error) {
    console.log('GAccountFactory: ', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// GAccountFactory deployed to 0x45566Bfb67D30A9da551F6b171C389229aae7E88
// npx hardhat verify --network nebulas 0x965aD51893144E91086c0c3EcbEB7066dA451320 0xBBF92F72a4627CEc4517aAcD817144014a8f64D8 0x9aEfB3a61787d30f33B4049382647e1D85Eb50EB