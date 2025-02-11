import { JsonRpcProvider } from "@ethersproject/providers"
import { IEntryPoint, IEntryPoint__factory } from "./soltypes"
import { DeterministicDeployer } from "./DeterministicDeployer"
import { bytecode as gAccountFactoryByteCode, abi as gAccountFactoryABI } from "@layerg-ua-sdk/aa-smc/artifacts/contracts/g-account/GAccountFactory.sol/GAccountFactory.json"
import { Signer, ethers } from "ethers"

const factoryAccountPointSalt = '0x90d8084deab30c2a37c45e8d47f49f2f7965183cb6990a98943ef94940681de0'
const defaultAdmin = "0x556180984Ec8B4d28476376f99A071042f262a5c"
const entryPointContract = "0x803Cf2b820bcE4774DdfeB5CA13169Ef96fAc0d7"

const factoryInterface = new ethers.utils.Interface(gAccountFactoryABI);
const encodedArgs = factoryInterface.encodeDeploy([defaultAdmin, entryPointContract]);
const fullBytecode = gAccountFactoryByteCode + encodedArgs.slice(2); // Full deployment code


export async function deployFactoryAccount (provider: JsonRpcProvider, signer: Signer = provider.getSigner()): Promise<IEntryPoint> {
    const addr = await new DeterministicDeployer(provider, signer).deterministicDeploy(fullBytecode, factoryAccountPointSalt)
    return IEntryPoint__factory.connect(addr, signer)
}
  