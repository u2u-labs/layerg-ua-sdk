import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0xd46FF3b330Ee924E4457fbe1c1ed7db5646f023C"
  const _owner = "0x556180984Ec8B4d28476376f99A071042f262a5c"
  const _signer = ["0x556180984Ec8B4d28476376f99A071042f262a5c"]

  const SingletonPaymaster = await ethers.getContractFactory("SingletonPaymaster");

  const singletonPaymaster = await SingletonPaymaster.deploy(_entryPoint, _owner, _signer); // Deploy the contract
  await singletonPaymaster.deployed();
  console.log(`SingletonPaymaster deployed to ${singletonPaymaster.address}`);
  const singletonPaymasterAddress = singletonPaymaster.address

  try {
    await hre.run("verify:verify", {
      address: singletonPaymasterAddress,
      constructorArguments: [_entryPoint, _owner, _signer],
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


// SingletonPaymaster at 0xd310620566b2fbdAb874BEa8F39e78B2Aa72A4d0