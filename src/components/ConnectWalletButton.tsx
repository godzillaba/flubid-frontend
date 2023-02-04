import React from 'react';
import { InjectedConnector } from '@wagmi/core';
import { useAccount, useConnect } from 'wagmi';
import { Button } from '@mui/material';

function shortenAddress(address: string): string {
    return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

export default function ConnectWalletButton() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect({
        connector: new InjectedConnector(),
    })

    if (isConnected) {
        return (
            <span>{address ? shortenAddress(address) : "ERROR"}</span>
        )
    }
    else {
        return (
            <Button color="inherit" onClick={() => connect()}>Connect Wallet</Button>
        )
    }
}

