import { JsonRpcProvider } from "@ethersproject/providers"
import { IEntryPoint, IEntryPoint__factory } from "./soltypes"
import { DeterministicDeployer } from "./DeterministicDeployer"
import { bytecode as entryPointByteCode } from "@layerg-ua-sdk/aa-smc/artifacts/contracts/core/EntryPoint.sol/EntryPoint.json"
import { Signer } from "ethers"

export const entryPointSalt = '0x90d8084deab30c2a37c45e8d47f49f2f7965183cb6990a98943ef94940681de0'

export async function deployEntryPoint (provider: JsonRpcProvider, signer: Signer = provider.getSigner()): Promise<IEntryPoint> {
    const addr = await new DeterministicDeployer(provider, signer).deterministicDeploy(entryPointByteCode, entryPointSalt)
    return IEntryPoint__factory.connect(addr, signer)
}

export function getEntryPointAddress (): string {
    return DeterministicDeployer.getAddress(entryPointByteCode, entryPointSalt)
}
  