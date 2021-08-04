import './App.css';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import { useEffect } from 'react';

const HOODIE_ADDRESS = "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75";

function App() {
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/6e758ef5d39a4fdeba50de7d10d08448");
  const hoodieContract = new ethers.Contract(HOODIE_ADDRESS, tokenVaultAbi, provider);

  useEffect(() => {
    async function demo() {
      console.log("Name: ", await hoodieContract.name());
      console.log("Reserve Price: ", ethers.utils.formatEther(await hoodieContract.reservePrice()));
      console.log("Total Supply: ", ethers.utils.formatEther(await hoodieContract.totalSupply()));
    }
    demo();
  }, []);

  return (
    <div>
      <h1>Punk Parts</h1>
    </div>
  );
}

export default App;
