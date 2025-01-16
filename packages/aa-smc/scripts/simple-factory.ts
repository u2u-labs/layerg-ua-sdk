import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0xd46FF3b330Ee924E4457fbe1c1ed7db5646f023C"

  const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");

  const simpleAccountFactory = await SimpleAccountFactory.deploy(_entryPoint); // Deploy the contract
  await simpleAccountFactory.deployed();
  console.log(`SimpleAccountFactory deployed to ${simpleAccountFactory.address}`);
  const simpleAccountFactoryContract = simpleAccountFactory.address

  try {
    await hre.run("verify:verify", {
      address: simpleAccountFactoryContract,
      constructorArguments: [_entryPoint],
    });
  } catch (error) {
    console.log('SimpleAccountFactory: ', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// SimpleAccountFactory deployed to 0x786006d1A698f2ED5457dB053Ba4231b2094Cb87