import React from 'react';
import { InjectedConnector } from '@wagmi/core';
import { useAccount, useConnect } from 'wagmi';
import { Alert, Button, useTheme } from '@mui/material';

type TransactionAlertProps = {
    type: 'pending' | 'complete',
    show: boolean
}

export default function TransactionAlert(props: TransactionAlertProps) {
    const theme = useTheme();

    if (!props.show) return <></>;

    if (props.type === 'pending') {
        return (
            <Alert 
            severity="info" 
            variant="outlined" 
            // color="info" 
            style={{
                position: 'absolute', 
                right: theme.spacing(2), 
                marginTop: theme.spacing(2)
            }}
            >
                Transaction Pending
            </Alert>
        )
    }
    else {
        return (
            <Alert 
            severity="success" 
            variant="outlined" 
            style={{
                position: 'absolute', 
                right: theme.spacing(2), 
                marginTop: theme.spacing(2)
            }}
            >
                Transaction Complete
            </Alert>
        )
    }
}

