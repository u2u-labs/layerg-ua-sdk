import { ethers } from "hardhat";

interface PoolArgs {
    name: string
    poolAdmin: string
    startTime: number
    firstUnlockPercentage: string
    lockDuration: number
    vestingDuration: number
    vestingPeriods: number
    totalPoolCap: string
}

const factoryAddress = "0xC493D168e4c135589eaa9b8AA10Dd8b49A1E8380"

const aMonth = 30 * 24 * 60 * 60

const poolArgs: PoolArgs[] = [
    {
        name: "Pool 16",
        poolAdmin: "0xb629A9b24AcE79211cB43f5b7e96f7AfeB8dD4E1",
        startTime: 1733803200,
        // startTime: 1736467200,
        firstUnlockPercentage: "8",
        lockDuration: (3* aMonth) + aMonth,
        // lockDuration: 300,
        vestingDuration: 18 * aMonth,
        // vestingDuration: 2 * 12 * 60,
        vestingPeriods: 18,
        totalPoolCap: "2000000"
    }
]


async function main() {
    let tx;
    const factory = await ethers.getContractAt("Factory", factoryAddress);
    let index = 0;
    while (index < poolArgs.length) {
        const params: PoolArgs = poolArgs[index]
        tx = await factory.newPool(
            params.name, 
            params.poolAdmin, 
            params.startTime, 
            ethers.parseEther(params.firstUnlockPercentage), 
            params.lockDuration, 
            params.vestingDuration, 
            params.vestingPeriods, 
            ethers.parseEther(params.totalPoolCap),
            { gasLimit: 3000000 }
        )
        console.log(`Pool ${index}, tx: ${tx.hash}`)
        await sleep(2000)
        ++index;
    }

}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// npx hardhat verify --network solaris 0xf7dd30c2c080fd2686c336c9339efd9d2e18adc2
// Factory deployed to 0x9d4c2E691b99E98Fc28aa5577C5CD2497994b59a
// Treasury deployed to 0xE8EA903324f9287A2698549230fC017bB3c4bbA5
