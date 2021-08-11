import '../App.css';
import { ethers } from "ethers";
import tokenVaultAbi from "../abis/token-vault-abi.json";
import React, { useEffect, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { gql } from '@apollo/client';
import { Container, Col, Row } from 'react-bootstrap';
import { useParams } from "react-router-dom";

import SwapsTable from './SwapsTable.js';
import punk7171 from '../images/punk7171.png';
import deadpunk from '../images/deadpunk.png';
import twinflames from '../images/twinflames.jpg';
import aglyph from '../images/aglyph.svg';
import abc123 from '../images/abc123.png';
import fvey from '../images/fvey.gif';
import peng from '../images/peng.png';
import sweep from '../images/sweep.png';

export const VAULTS = {
  hoodie: {
    token: "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75",
    pool: "0xf1a8f0d86659c67780e3396bd6aee05af3566c6a",
    image: punk7171
  },
  dead: {
    token: "0x0c7060bf06a78aaaab3fac76941318a52a3f4613",
    pool: "0xcae45fc418e37e1fdb8e20536a643c5bf2301e01",
    image: deadpunk
  },
  twin: {
    token: "0x82b2925e54ade5e10f5e6be31f604e5154701afa",
    pool: "0x9fc59d6b7323757147bed0931092e9354cab7434",
    image: twinflames
  },
  aglyph: {
    token: "0x8baad3be0eddf4ec8fbd9bc2946a972e30741f8c",
    pool: "0xacd175e3b03d5e7953e2ff3486b38c5e8e193005",
    image: aglyph
  },
  abc123: {
    token: "0x9ff4f50efd40c915f7d1476bf36acb8908e0c56d",
    pool: "0x9e3d38fec23e3351b5ecc0d0053e1fde889dedef",
    image: abc123
  },
  fvey: {
    image: fvey,
    token: "0xd1eda954f16f846d8ee943a0b0b5faafb81e2a91",
    pool: "0x175a72f57fb51998d76d63e9e6196f91ee6e0afb"
  },
  sweep: {
    token: "0xfe2a5b942083d92135c7fe364bb75218e547cc62",
    pool: "0xd9cfa54cc68ee6b67fb35b64e3a452c9c423e38f",
    image: sweep
  },
  peng: {
    token: "0xd532bd173d5519b4f1a37197a1d256329c2e8f35",
    pool: "0x97ecbd29f48be6c6c20b163423b703876f6f8dfd",
    image: peng
  }
}

export default function Analytics({jsonRpcProvider, apolloClient}) {
  const { vault } = useParams();
  const tokenContract = new ethers.Contract(VAULTS[vault].token, tokenVaultAbi, jsonRpcProvider);

  // from token contract (fractional's tokenVault) using ethers
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

  // Retrieve data when vault changes
  useEffect(() => {
    async function retrieveData() {
      // Ethers contract data
      setName(await tokenContract.name());
      setSymbol(await tokenContract.symbol());
      setReservePrice(ethers.utils.formatEther(await tokenContract.reservePrice()));
      setTotalSupply(ethers.utils.formatEther(await tokenContract.totalSupply()));
      
      // Uniswap v3 subgraph data
      // Run once for poolQueryData
      const poolQuery = `
        {
          pool (id: "${VAULTS[vault].pool}") {
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
      let poolQueryData = (await apolloClient.query({query: gql(poolQuery)})).data.pool;
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
          pool (id: "${VAULTS[vault].pool}") {
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
        singlePagePoolHourData = (await apolloClient.query({query: gql(poolHourDataQuery)})).data.pool.poolHourData;
        poolHourDataSkip += 100;
        // Have to update the query 
        poolHourDataQuery = `
        {
          pool (id: "${VAULTS[vault].pool}") {
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
      setPoolHourData(allPoolHourData.slice(1).map(x => ({  // Remove the first tick as that starts at 0
        close: parseFloat(x.close),
        time: x.periodStartUnix,
        open: parseFloat(x.open),
        low: parseFloat(x.low),
        high: parseFloat(x.high)
      })));
    }
    retrieveData();
  }, [vault]);

  // Graph OHLCs
  useEffect(() => {
    // Check token0 and token1 to prevent extra graphing
    if (poolHourData.length && [token0, token1].includes(vault.toUpperCase()) && [token0, token1].includes("WETH")) {
      // Clear the chart
      document.getElementById("chart").innerHTML = "";

      // If token 0 is not WETH, then we have to inverse all the OHLCs
      let graphData = poolHourData;
      if (token0 !== 'WETH') {
        graphData = graphData.map(x => ({
          close: 1/parseFloat(x.close),
          time: x.time,
          open: 1/parseFloat(x.open),
          low: 1/parseFloat(x.low),
          high: 1/parseFloat(x.high)
        }));
      }

      const chart = LightweightCharts.createChart(document.getElementById("chart"), {
        width: 525,
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
      if (graphData[graphData.length-1].close < 1) {
        let decimals = Math.ceil(-(Math.log10(graphData[graphData.length-1].close)));
        candleSeries.applyOptions({
          priceFormat: {
            type: 'custom',
            minMove: 1/10**(decimals+1),
            precision: decimals,
            formatter: price => parseFloat(price).toFixed(decimals+1),
          }
        });
      } else {
        candleSeries.applyOptions({
          priceFormat: {
            type: 'custom',
            minMove: 0.1,
            precision: 2,
            formatter: price => parseFloat(price).toFixed(2),
          }
        });
      }
      candleSeries.setData(graphData);
    }
  }, [poolHourData, token0]);

  return (
    <Container>
      <Row className="my-3">
        <Col md="auto">
          <h1 className="text-center">${symbol}</h1>
          <div className="text-center">
            <img src={VAULTS[vault].image} width="260px" style={{borderRadius: "25px"}}></img>
          </div>
        </Col>
        <Col md="auto" style={{display: "flex", alignItems: "center"}}>
          <div style={{borderStyle: "ridge", borderRadius: "16px", padding: "15px", background: 'rgba(83, 83, 83, 0.55)'}}>
            <div><b>Token:&nbsp;</b>${symbol}</div>
            <div><b>Name:&nbsp;</b>{name}</div>
            <div><b>Reserve Price:&nbsp;</b>{parseFloat(reservePrice).toFixed(2)} ETH</div>
            <div><b>Total Supply:&nbsp;</b>{totalSupply && parseInt(totalSupply).toLocaleString()}</div>
            <div><b>{token1} Price:&nbsp;</b>{parseFloat(token0Price).toFixed(5)} {token0}</div>
            <div><b>{token0} Price:&nbsp;</b>{parseFloat(token1Price).toFixed(5)} {token1}</div>
            <div><b>{token0} Liquidity:&nbsp;</b>{parseFloat(liquidityToken0).toFixed(2)} {token0}</div>
            <div><b>{token1} Liquidity:&nbsp;</b>{parseFloat(liquidityToken1).toFixed(2)} {token1}</div>
            <div className="mb-2"><b>Implied Valuation:&nbsp;</b>
              {token0 === 'WETH'
                ? <span>{(parseFloat(totalSupply)*parseFloat(token0Price)).toFixed(2)} {token0}</span>
                : <span>{(parseFloat(totalSupply)*parseFloat(token1Price)).toFixed(2)} {token1}</span>
              }
            </div>
            <div><b><a href={`https://fractional.art/vaults/${VAULTS[vault].token}`} target="_blank">Fractional Vault ↗️</a></b></div>
            <div><b><a href={`https://etherscan.io/address/${VAULTS[vault].token}`} target="_blank">Etherscan Contract ↗️</a></b></div>
            <div><b><a href={`https://info.uniswap.org/#/pools/${VAULTS[vault].pool}`} target="_blank">Uniswap V3 Analytics ↗️</a></b></div>
          </div>
        </Col>
        <Col md="auto" style={{display: "flex", alignItems: "center"}}>
          {poolHourData.length && 
          <div>
            <span><b>Hourly OHLC Chart (WETH per HOODIE)</b></span>
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
  )
}