import React, { Component, useState } from 'react';
import ReactDOM from 'react-dom';
import '@fontsource/roboto';

import NetworkSelect from './components/NetworkSelect';
import TopBar from './components/TopBar';

import { WagmiConfig, createClient, configureChains, useAccount, useNetwork, goerli, useProvider } from 'wagmi'
import { polygonMumbai } from 'wagmi/chains'

import { publicProvider } from 'wagmi/providers/public'

import { Routes, Route, HashRouter } from "react-router-dom";
import Explore from './pages/Explore';
import MyAuctions from './pages/MyAuctions';
import CreateAuction from './pages/CreateAuction';
import Auction from './pages/Auction';
import { Container, createTheme, CssBaseline, ScopedCssBaseline, ThemeProvider } from '@mui/material';
import TransactionAlert from './components/TransactionAlert';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import ManageAuction from './pages/ManageAuction';
import { GenericRentalAuction_filter } from './graph/.graphclient';
import { constants, isChainSupported } from './helpers';


const { provider, webSocketProvider } = configureChains(
  constants.chains.map(x => x),
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

export enum TransactionAlertStatus {
  None = "None",
  Pending = "Pending",
  Success = "Succeeded",
  Fail = "Failed"
}

export const MyContext = React.createContext({
  setTransactionAlertStatus: (status: TransactionAlertStatus) => {}
});

function App() {
  document.title = 'FluBid';

  const { isConnected } = useAccount();
  const { chain, chains } = useNetwork();

  const [transactionAlertStatus, setTransactionAlertStatus] = useState<TransactionAlertStatus>(TransactionAlertStatus.None);
  const [lastTimeout, setLastTimeout] = useState<NodeJS.Timeout>();

  function handleTransactionAlertChange(status: TransactionAlertStatus) {
    clearTimeout(lastTimeout);
    setTransactionAlertStatus(status);
    if (status != TransactionAlertStatus.Pending) {
      setLastTimeout(setTimeout(() => {
        setTransactionAlertStatus(TransactionAlertStatus.None);
      }, constants.transactionAlertTimeout));
    }
  }

  return (
    <WagmiConfig client={client}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline/>
        <HashRouter>
          <TopBar></TopBar>
          <MyContext.Provider value={{ setTransactionAlertStatus: handleTransactionAlertChange }}>
            <TransactionAlert status={transactionAlertStatus}/>
            {
              isConnected && chain && isChainSupported(chain.id) ? 
                <Routes>
                  <Route path="/" element={<Explore/>}/>
                  <Route path="/my-auctions" element={<MyAuctions/>}/>
                  <Route path="/create-auction" element={<CreateAuction/>}/>
                  <Route path="/manage-auction/:auctionChainId/:auctionAddress" element={<ManageAuction/>}/>
                  <Route path="/auction/:auctionChainId/:auctionAddress" element={<Auction/>}/>
                </Routes>
              : <p>Please connect wallet and connect to a supported network.</p>
            }
          </MyContext.Provider>
        </HashRouter>
      </ThemeProvider>
    </WagmiConfig>
  );
}


export default App;
