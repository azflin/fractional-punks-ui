import './App.css';
import { ethers } from "ethers";
import React from 'react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { JSONRPC_PROVIDER } from "./secrets.json";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import Analytics from './components/Analytics';

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
    <Router>
      <Root>
        <Sidebar>
          <h3 className="text-center" style={{borderStyle: 'groove'}}>FRACTIONAL VAULTS</h3>        
            <ul>
              <li><Link to="/hoodie">$HOODIE</Link></li>
              <li><Link to="/dead">$DEAD</Link></li>
            </ul>
        </Sidebar>
        <Main>
          <Switch>
            <Route path="/:vault" children={<Analytics jsonRpcProvider={provider} apolloClient={client} />} />
          </Switch>
        </Main>
      </Root>
    </Router>
  );
}

export default App;
