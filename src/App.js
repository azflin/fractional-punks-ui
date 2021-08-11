import './App.css';
import { ethers } from "ethers";
import React from 'react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { JSONRPC_PROVIDER } from "./secrets.json";

import Analytics from './components/Analytics';

const HOODIE_ADDRESS = "0xdffa3a7f5b40789c7a437dbe7b31b47f9b08fe75";
const POOL_ADDRESS = "0xf1a8f0d86659c67780e3396bd6aee05af3566c6a";
const UNISWAP_V3_APIURL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

function App() {
  const provider = new ethers.providers.JsonRpcProvider(JSONRPC_PROVIDER);
  // client for GraphQL queries
  const client = new ApolloClient({
    uri: UNISWAP_V3_APIURL,
    cache: new InMemoryCache()
  });

  const Root = (props) => (
    <div style={{
      display: 'flex'
    }} {...props}/>
  )

  const Sidebar = (props) => (
    <div style={{
      width: '250px',
      height: '100vh',
      overflow: 'auto',
      borderStyle: 'groove'
    }} {...props} />
  )

  const Main = (props) => (
    <div style={{
      flex: 1,
      height: '100vh',
      overflow: 'auto'
    }} {...props} />
  )

  return (
    <Root>
      <Sidebar>
        <h3 className="text-center" style={{borderStyle: 'groove'}}>FRACTIONAL VAULTS</h3>
      </Sidebar>
      <Main>
        <Analytics tokenAddress={HOODIE_ADDRESS} poolAddress={POOL_ADDRESS} jsonRpcProvider={provider} apolloClient={client}></Analytics>
      </Main>
    </Root>
  );
}

export default App;
