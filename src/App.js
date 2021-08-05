import './App.css';
import { Container, Col, Row, Table } from 'react-bootstrap';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import React, { useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useTable } from 'react-table';

import SwapsTable from './components/SwapsTable.js';
import punk7171 from './images/punk7171.png';

const HOODIE_ADDRESS = "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75";
const POOL_ADDRESS = "0xf1a8f0d86659c67780e3396bd6aee05af3566c6a";
const UNISWAP_V3_APIURL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

const poolQuery = `
  {
    pool (id: "${POOL_ADDRESS}") {
      token0 {
        symbol
      },
      token1 {
        symbol
      },
      token0Price,
      token1Price,
      totalValueLockedToken0,
      totalValueLockedToken1,
      swaps {
        timestamp,
        amount0,
        amount1
      },
      poolHourData {
        periodStartUnix
        open,
        high,
        low,
        close
      }
    }
  }
`

function App() {
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/6e758ef5d39a4fdeba50de7d10d08448");
  const hoodieContract = new ethers.Contract(HOODIE_ADDRESS, tokenVaultAbi, provider);
  const client = new ApolloClient({
    uri: UNISWAP_V3_APIURL,
    cache: new InMemoryCache()
  });

  // from HOODIE contract (fractional's tokenVault) using ethers
  const [name, setName] = useState();
  const [symbol, setSymbol] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [totalSupply, setTotalSupply] = useState();

  // from UNISWAP V3 graph
  const [token0, setToken0] = useState();
  const [token1, setToken1] = useState();
  const [token0Price, setToken0Price] = useState();
  const [token1Price, setToken1Price] = useState();
  const [liquidityToken0, setLiquidityToken0] = useState();
  const [liquidityToken1, setLiquidityToken1] = useState();
  const [swaps, setSwaps] = useState([]);

  // Build swaps table
  const columns = React.useMemo(
    () => [
      {
        Header: 'Date',
        accessor: 'timestamp'
      },
      {
        Header: 'ETH',
        accessor: 'amount0'
      },
      {
        Header: 'HOODIE',
        accessor: 'amount1'
      }
    ],
    []
  )
  const tableInstance = useTable({ columns, data: swaps });
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;


  // Initially retrieve data
  useEffect(() => {
    console.log("Using effect!");
    async function retrieveData() {
      // Ethers contract data
      setName(await hoodieContract.name());
      setSymbol(await hoodieContract.symbol());
      setReservePrice(ethers.utils.formatEther(await hoodieContract.reservePrice()));
      setTotalSupply(ethers.utils.formatEther(await hoodieContract.totalSupply()));
      
      // Graph data
      let graphData = (await client.query({query: gql(poolQuery)})).data.pool;
      console.log(graphData);
      setToken0(graphData.token0.symbol);
      setToken1(graphData.token1.symbol);
      setToken0Price(graphData.token0Price);
      setToken1Price(graphData.token1Price);
      setLiquidityToken0(graphData.totalValueLockedToken0);
      setLiquidityToken1(graphData.totalValueLockedToken1);
      setSwaps(graphData.swaps);
    }
    retrieveData();
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
          <div><strong>Token:&nbsp;</strong>${symbol}</div>
          <div><strong>Reserve Price:&nbsp;</strong>{reservePrice}</div>
          <div><strong>Total Supply:&nbsp;</strong>{totalSupply}</div>
          <div><strong>{token1} Price:&nbsp;</strong>{token0Price} {token0}</div>
          <div><strong>{token0} Price:&nbsp;</strong>{token1Price} {token1}</div>
          <div><strong>{token0} Liquidity:&nbsp;</strong>{liquidityToken0} {token0}</div>
          <div><strong>{token1} Liquidity:&nbsp;</strong>{liquidityToken1} {token1}</div>
          <div><strong>Implied Valuation:&nbsp;</strong>{parseFloat(totalSupply)*parseFloat(token0Price)} {token0}</div>
        </Col>
      </Row>
      <Row>
        <SwapsTable swaps={swaps}></SwapsTable>
      </Row>
    </Container>
  );
}

export default App;
