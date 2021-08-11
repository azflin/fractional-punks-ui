import '../App.css';
import { ethers } from "ethers";
import tokenVaultAbi from "../abis/token-vault-abi.json";
import React, { useEffect, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { gql } from '@apollo/client';

import SwapsTable from './SwapsTable.js';
import punk7171 from '../images/punk7171.png';

export default function Analytics({tokenAddress, poolAddress, jsonRpcProvider, apolloClient}) {
  const tokenContract = new ethers.Contract(tokenAddress, tokenVaultAbi, jsonRpcProvider);

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

  // Initially retrieve data
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
          pool (id: "${poolAddress}") {
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
      console.log(poolQueryData);
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
          pool (id: "${poolAddress}") {
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
          pool (id: "${poolAddress}") {
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

  return (
    <div></div>
  )
}