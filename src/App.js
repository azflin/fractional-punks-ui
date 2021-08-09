import './App.css';
import { Container, Col, Row } from 'react-bootstrap';
import { ethers } from "ethers";
import tokenVaultAbi from "./abis/token-vault-abi.json";
import React, { useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { JSONRPC_PROVIDER } from "./secrets.json";
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
      }
    }
  }
`

function App() {
  const provider = new ethers.providers.JsonRpcProvider(JSONRPC_PROVIDER);
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
  const [poolHourData, setPoolHourData] = useState([]);

  // Initially retrieve data
  useEffect(() => {
    async function retrieveData() {
      // Ethers contract data
      setName(await hoodieContract.name());
      setSymbol(await hoodieContract.symbol());
      setReservePrice(ethers.utils.formatEther(await hoodieContract.reservePrice()));
      setTotalSupply(ethers.utils.formatEther(await hoodieContract.totalSupply()));
      
      // Uniswap v3 subgraph data
      // Run once for poolQueryData
      let poolQueryData = (await client.query({query: gql(poolQuery)})).data.pool;
      setToken0(poolQueryData.token0.symbol);
      setToken1(poolQueryData.token1.symbol);
      setToken0Price(poolQueryData.token0Price);
      setToken1Price(poolQueryData.token1Price);
      setLiquidityToken0(poolQueryData.totalValueLockedToken0);
      setLiquidityToken1(poolQueryData.totalValueLockedToken1);
      setSwaps(poolQueryData.swaps);
      // Paginate until all pool hour data is fetched
      let singlePagePoolHourData;
      let allPoolHourData = [];
      let poolHourDataSkip = 0;
      let poolHourDataQuery = `
        {
          pool (id: "${POOL_ADDRESS}") {
            poolHourData(first: 100, skip: ${poolHourDataSkip}) {
              periodStartUnix,
              open,
              high,
              low,
              close
            }
          }
        }
      `
      do {
        singlePagePoolHourData = (await client.query({query: gql(poolHourDataQuery)})).data.pool.poolHourData;
        poolHourDataSkip += 100;
        // Have to update the query 
        poolHourDataQuery = `
        {
          pool (id: "${POOL_ADDRESS}") {
            poolHourData(first: 100, skip: ${poolHourDataSkip}) {
              periodStartUnix,
              open,
              high,
              low,
              close
            }
          }
        }
        `
        allPoolHourData.push(...singlePagePoolHourData);
      } while (singlePagePoolHourData.length === 100);
      setPoolHourData(allPoolHourData.map(x => ({
        close: parseFloat(x.close),
        time: x.periodStartUnix,
        open: parseFloat(x.open),
        low: parseFloat(x.low),
        high: parseFloat(x.high)})));
    }
    retrieveData();
  }, []);

  // Graph OHLCs
  useEffect(() => {
    if (poolHourData.length) {
      const chart = LightweightCharts.createChart(document.getElementById("chart"), {
        width: 600,
        height: 300,
        layout: {
          backgroundColor: 'rgba(255, 255, 255, 1)',
          textColor: 'rgba(0, 0, 0, 1)',
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
        }
      });
      const candleSeries = chart.addCandlestickSeries({
        upColor: 'rgba(0, 255, 0, 1)',
        downColor: 'rgba(255, 0, 0, 1)',
        borderDownColor: 'rgba(0, 0, 0, 1)',
        borderUpColor: 'rgba(0, 0, 0, 1)',
        wickDownColor: 'rgba(0, 0, 0, 1)',
        wickUpColor: 'rgba(0, 0, 0, 1)',
      });
      candleSeries.applyOptions({
        priceFormat: {
          type: 'custom',
          minMove: 0.001,
          precision: 3,
          formatter: price => parseFloat(price).toFixed(3),
        }
      });
      candleSeries.setData(poolHourData);
    }
  }, [poolHourData]);

  return (
    <Container>
      <Row className="my-3">
        <Col md="auto">
          <h1 className="text-center">${symbol}</h1>
          <div className="text-center">
            <img src={punk7171} width="260px" style={{borderRadius: "25px"}}></img>
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
        <Col md="auto" style={{display: "flex", alignItems: "center"}}>
          {poolHourData.length && 
          <div>
            <span><strong>Hourly OHLC Chart (WETH per HOODIE)</strong></span>
            <div id="chart"></div>
          </div>}
        </Col>
      </Row>
      <Row>
        { swaps.length && token0 && token1 &&
        <SwapsTable swaps={swaps} token0={token0} token1={token1}></SwapsTable>
        }
      </Row>
      <Row>
        <span className="mt-4">Made by <a href="https://twitter.com/AzFlin">@AzFlin</a></span>
      </Row>
    </Container>
  );
}

export default App;
