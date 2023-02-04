import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';


import Button from '@material-ui/core/Button';
import { AppBar, Container, FormControl, IconButton, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import '@fontsource/roboto';
import MenuIcon from "@material-ui/icons/Menu";
import NetworkSelect from './components/NetworkSelect';
import TopBar from './components/TopBar';

import { WagmiConfig, createClient, configureChains, mainnet, goerli } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

import { Routes, Route, HashRouter } from "react-router-dom";
import Explore from './pages/Explore';
import MyAuctions from './pages/MyAuctions';
import CreateAuction from './pages/CreateAuction';


const { chains, provider, webSocketProvider } = configureChains(
 [mainnet, goerli],
 [publicProvider()],
)

const client = createClient({
 autoConnect: true,
 provider,
 webSocketProvider,
})


function App() {

  // const useStyles = makeStyles((theme) => ({
  //   root: {
  //     flexGrow: 1,
  //   },
  //   menuButton: {
  //     marginRight: theme.spacing(2),
  //   },
  //   title: {
  //     flexGrow: 1,
  //   },
  // }));

  // const classes = useStyles();

  return (
    <WagmiConfig client={client}>
      <ScopedCssBaseline>
        <HashRouter>
          <TopBar></TopBar>
          <Container>
            <Routes>
              <Route path="/" element={<Explore/>}/>
              <Route path="/my-auctions" element={<MyAuctions/>}/>
              <Route path="/create-auction" element={<CreateAuction/>}/>
            </Routes>
          </Container>
        </HashRouter>
      </ScopedCssBaseline>
    </WagmiConfig>
  );
}


export default App;
