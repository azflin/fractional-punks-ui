import './App.css';
import { Container, Col, Row } from 'react-bootstrap';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import React, { useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import * as LightweightCharts from 'lightweight-charts';

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
      swaps(orderBy: timestamp, orderDirection: desc) {
        timestamp,
        amount0,
        amount1
      },
      poolDayData {
        date,
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
  // client for GraphQL queries
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
  const [poolDayData, setPoolDayData] = useState([]);

  // Initially retrieve data
  useEffect(() => {
    async function retrieveData() {
      // Ethers contract data
      setName(await hoodieContract.name());
      setSymbol(await hoodieContract.symbol());
      setReservePrice(ethers.utils.formatEther(await hoodieContract.reservePrice()));
      setTotalSupply(ethers.utils.formatEther(await hoodieContract.totalSupply()));
      
      // Uniswap v3 subgraph data
      let graphData = (await client.query({query: gql(poolQuery)})).data.pool;
      setToken0(graphData.token0.symbol);
      setToken1(graphData.token1.symbol);
      setToken0Price(graphData.token0Price);
      setToken1Price(graphData.token1Price);
      setLiquidityToken0(graphData.totalValueLockedToken0);
      setLiquidityToken1(graphData.totalValueLockedToken1);
      setSwaps(graphData.swaps);
      setPoolDayData(graphData.poolDayData.map(x => ({
        close: parseFloat(x.close),
        time: (new Date(x.date * 1000)).toISOString().split('T')[0],
        open: parseFloat(x.open),
        low: parseFloat(x.low),
        high: parseFloat(x.high)})));
    }
    retrieveData();
  }, []);

  // Graph OHLCs
  useEffect(() => {
    if (poolDayData.length) {
      console.log(poolDayData);
      const chart = LightweightCharts.createChart(document.getElementById("chart"), {
        width: 600,
        height: 300,
        layout: {
          backgroundColor: '#000000',
          textColor: 'rgba(255, 255, 255, 0.9)',
        },
        grid: {
          vertLines: {
            color: 'rgba(197, 203, 206, 0.5)',
          },
          horzLines: {
            color: 'rgba(197, 203, 206, 0.5)',
          },
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
      });
      const candleSeries = chart.addCandlestickSeries({
        upColor: 'rgba(255, 144, 0, 1)',
        downColor: '#000',
        borderDownColor: 'rgba(255, 144, 0, 1)',
        borderUpColor: 'rgba(255, 144, 0, 1)',
        wickDownColor: 'rgba(255, 144, 0, 1)',
        wickUpColor: 'rgba(255, 144, 0, 1)',
      });
      candleSeries.setData(poolDayData);
    }
  }, [poolDayData]);

  return (
    <Container>
      <Row className="my-3">
        <Col md="auto">
          <h1 className="text-center">${symbol}</h1>
          <div className="text-center">
            <img src={punk7171} width="250px" style={{borderRadius: "25px"}}></img>
          </div>
        </Col>
        <Col md="auto" style={{display: "flex", alignItems: "center"}}>
          <div style={{borderStyle: "ridge", borderRadius: "16px", padding: "15px", background: 'rgba(83, 83, 83, 0.55)'}}>
            <div><strong>Token:&nbsp;</strong>${symbol}</div>
            <div><strong>Name:&nbsp;</strong>{name}</div>
            <div><strong>Reserve Price:&nbsp;</strong>{parseFloat(reservePrice).toFixed(2)} ETH</div>
            <div><strong>Total Supply:&nbsp;</strong>{totalSupply && parseInt(totalSupply).toLocaleString()}</div>
            <div><strong>{token1} Price:&nbsp;</strong>{parseFloat(token0Price).toFixed(5)} {token0}</div>
            <div><strong>{token0} Price:&nbsp;</strong>{parseFloat(token1Price).toFixed(2)} {token1}</div>
            <div><strong>{token0} Liquidity:&nbsp;</strong>{parseFloat(liquidityToken0).toFixed(2)} {token0}</div>
            <div><strong>{token1} Liquidity:&nbsp;</strong>{parseFloat(liquidityToken1).toFixed(2)} {token1}</div>
            <div><strong>Implied Valuation:&nbsp;</strong>{(parseFloat(totalSupply)*parseFloat(token0Price)).toFixed(2)} {token0}</div><br></br>
            <div><strong><a href={`https://fractional.art/vaults/${HOODIE_ADDRESS}`} target="_blank">Fractional Vault ↗️</a></strong></div>
            <div><strong><a href={`https://etherscan.io/address/${HOODIE_ADDRESS}`} target="_blank">Etherscan Contract ↗️</a></strong></div>
            <div><strong><a href={`https://info.uniswap.org/#/pools/${POOL_ADDRESS}`} target="_blank">Uniswap V3 Analytics ↗️</a></strong></div>
          </div>
        </Col>
        <Col md="auto">
          <div id="chart"></div>
        </Col>
      </Row>
      <Row>
        { swaps.length && token0 && token1 &&
        <SwapsTable swaps={swaps} token0={token0} token1={token1}></SwapsTable>
        }
      </Row>
    </Container>
  );
}

export default App;
