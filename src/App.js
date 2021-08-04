import './App.css';
import { Container, Col, Row, Table } from 'react-bootstrap';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import { useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import punk7171 from './images/punk7171.png'

const HOODIE_ADDRESS = "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75";
const POOL_ADDRESS = "0xf1a8f0d86659c67780e3396bd6aee05af3566c6a";
const APIURL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

const poolQuery = `
  {
    pool (id: "${POOL_ADDRESS}") {
      token0Price,
      token1Price,
      totalValueLockedToken0,
      totalValueLockedToken1,
      swaps {
        timestamp,
        amount0,
        amount1
      }
    }
  }
`

function App() {
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/6e758ef5d39a4fdeba50de7d10d08448");
  const hoodieContract = new ethers.Contract(HOODIE_ADDRESS, tokenVaultAbi, provider);
  const client = new ApolloClient({
    uri: APIURL,
    cache: new InMemoryCache()
  });

  const [name, setName] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [totalSupply, setTotalSupply] = useState();

  // Initially retrieve HOODIE's contract data
  useEffect(() => {
    async function demo() {
      setName(await hoodieContract.name());
      setReservePrice(ethers.utils.formatEther(await hoodieContract.reservePrice()));
      setTotalSupply(ethers.utils.formatEther(await hoodieContract.totalSupply()));
      console.log(await client.query({query: gql(poolQuery)}));
    }
    demo();
  }, []);

  return (
    <Container>
      <Row>
        <h1 className="text-center">{name}</h1>
        <div className="text-center">
          <img src={punk7171} width="250px"></img>
        </div>
      </Row>
      <Row>
        <Col>
          <div><strong>Reserve Price:&nbsp;</strong>{reservePrice}</div>
          <div><strong>Total Supply:&nbsp;</strong>{totalSupply}</div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
