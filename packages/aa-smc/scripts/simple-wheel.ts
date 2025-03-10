import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const _token = "0xb4B5665e8204EE2C5Abd067d802b7EeA13147C2D"
  const SimpleLuckyWheel = await ethers.getContractFactory("SimpleLuckyWheel");
  const simpleLuckyWheel = await SimpleLuckyWheel.deploy(_token);
  await simpleLuckyWheel.deployed();
  console.log(`SimpleLuckyWheel deployed to ${simpleLuckyWheel.address}`);
  const simpleLuckyWheelAddress = simpleLuckyWheel.address

  try {
    await hre.run("verify:verify", {
      address: simpleLuckyWheelAddress,
      constructorArguments: [_token],
      contract: "contracts/samples/SimpleLuckyWheel.sol:SimpleLuckyWheel" // Specify the contract path

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
