import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337 // Cambiamos de 31337 a 1337 para que coincida con tu MetaMask
    }
  }
};

export default config;
