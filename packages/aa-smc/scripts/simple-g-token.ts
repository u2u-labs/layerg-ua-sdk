import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  let tx;
  const SimpleGToken = await ethers.getContractFactory("SimpleGToken");
  const gToken = await SimpleGToken.deploy(); // Deploy the contract
  await gToken.deployed();
  console.log(`SimpleGToken deployed to ${gToken.address}`);
  const gTokenAddress = gToken.address

  try {
    await hre.run("verify:verify", {
      address: gTokenAddress,
      constructorArguments: [],
      contract: "contracts/samples/SimpleGToken.sol:SimpleGToken" // Specify the contract path
    });
  } catch (error) {
    console.log('SimpleGToken: ', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// GAccountFactory deployed to 0x45566Bfb67D30A9da551F6b171C389229aae7E88
// npx hardhat verify --network nebulas 0xF5E7aA6d468D0884381524Ef2DFF4CE8306c4F3C 0xBBF92F72a4627CEc4517aAcD817144014a8f64D8 0x9aEfB3a61787d30f33B4049382647e1D85Eb50EB
// GAccountFactory deployed to 0xb0De0517B7e300dc051CB9a07dDbC45DB6D2f13B