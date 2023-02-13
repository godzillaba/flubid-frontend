import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import '@fontsource/roboto';

import NetworkSelect from './components/NetworkSelect';
import TopBar from './components/TopBar';

import { WagmiConfig, createClient, configureChains, useAccount, useNetwork } from 'wagmi'
import { polygonMumbai } from 'wagmi/chains'

import { publicProvider } from 'wagmi/providers/public'

import { Routes, Route, HashRouter } from "react-router-dom";
import Explore from './pages/Explore';
import MyAuctions from './pages/MyAuctions';
import CreateAuction from './pages/CreateAuction';
import Auction from './pages/Auction';
import { Container, createTheme, CssBaseline, ScopedCssBaseline, ThemeProvider } from '@mui/material';


const { provider, webSocketProvider } = configureChains(
  [polygonMumbai],
  [publicProvider()],
)

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});


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

  const { isConnected } = useAccount();
  const { chain, chains } = useNetwork();

  return (
    <WagmiConfig client={client}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline/>
        <HashRouter>
          <TopBar></TopBar>
          {
            isConnected && chain?.id == polygonMumbai.id ?  // todo multichain
              <Routes>
                <Route path="/" element={<Explore/>}/>
                <Route path="/my-auctions" element={<MyAuctions/>}/>
                <Route path="/create-auction" element={<CreateAuction/>}/>
                <Route path="/auction/:auctionAddress" element={<Auction/>}/>
              </Routes>
            : null
          }
        </HashRouter>
      </ThemeProvider>
    </WagmiConfig>
  );
}


export default App;
