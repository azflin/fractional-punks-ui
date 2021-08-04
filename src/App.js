import './App.css';
import { Container, Col, Row, Table } from 'react-bootstrap';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import { useEffect, useState } from 'react';
import punk7171 from './images/punk7171.png'

const HOODIE_ADDRESS = "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75";

function App() {
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/6e758ef5d39a4fdeba50de7d10d08448");
  const hoodieContract = new ethers.Contract(HOODIE_ADDRESS, tokenVaultAbi, provider);

  const [name, setName] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [totalSupply, setTotalSupply] = useState();

  // Initially retrieve HOODIE's contract data
  useEffect(() => {
    async function demo() {
      setName(await hoodieContract.name());
      setReservePrice(await hoodieContract.reservePrice());
      setTotalSupply(await hoodieContract.totalSupply());
    }
    demo();
  }, []);

  return (
    <Container>
      <h1 className="text-center">{name}</h1>
      <div className="text-center">
        <img src={punk7171} width="250px"></img>
      </div>
    </Container>
  );
}

export default App;
