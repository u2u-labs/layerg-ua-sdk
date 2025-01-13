import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _entryPoint = "0x1E1633F78Ae50Ff506FF8712431aE6618B8E7D6B"

  const simpleAccountFactory = await ethers.deployContract("SimpleAccountFactory", [_entryPoint]);
  await simpleAccountFactory.waitForDeployment();
  console.log(`SimpleAccountFactory deployed to ${simpleAccountFactory.target}`);
  const simpleAccountFactoryContract = simpleAccountFactory.target

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


// SimpleAccountFactory deployed to 0xf83745e6F466469346560Db7Df41c061d1544c80