import './App.css';
import { ethers } from "ethers";
import React from 'react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { JSONRPC_PROVIDER } from "./secrets.json";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

import Analytics, { VAULTS } from './components/Analytics';

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

  const links = Object.entries(VAULTS).map(([x, y]) => {
    return <li key={x} className="sidebar-link"><Link to={"/" + x} style={{color: "inherit", fontSize: "125%"}}><div>${x.toUpperCase()}</div></Link></li>
  });

  return (
    <Router>
      <Root>
        <Sidebar>
          <h3 className="text-center" style={{borderStyle: 'groove'}}>FRACTIONAL VAULTS</h3>        
          <ul>
            {links}
          </ul>
        </Sidebar>
        <Main>
          <Switch>
            <Route exact path="/">
              <Redirect to="/hoodie" />
            </Route>
            <Route path="/:vault" children={<Analytics jsonRpcProvider={provider} apolloClient={client} />} />
          </Switch>
        </Main>
      </Root>
    </Router>
  );
}

export default App;
