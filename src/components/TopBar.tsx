import { AppBar, Button, Toolbar } from '@material-ui/core';
import { InjectedConnector } from '@wagmi/core';
import React from 'react';
import { useAccount, useConnect } from 'wagmi';
import NetworkSelect from './NetworkSelect';

function shortenAddress(address: string): string {
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

export default function TopBar() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })

  console.log(address)

  return (
      <AppBar position="static">
        <Toolbar>
          <div style={{ flexGrow: 1 }}>
            <Button color="inherit">Explore</Button>
            <Button color="inherit">My Auctions</Button>
            <Button color="inherit">Create Auction</Button>
          </div>
          <NetworkSelect></NetworkSelect>
          {!isConnected ? <Button color="inherit" onClick={() => connect()}>Connect Wallet</Button> : <span>{address ? shortenAddress(address) : "ERROR"}</span>}
        </Toolbar>
      </AppBar>
    );
  }

