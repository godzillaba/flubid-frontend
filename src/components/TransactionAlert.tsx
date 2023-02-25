import React from 'react';
import { InjectedConnector } from '@wagmi/core';
import { useAccount, useConnect } from 'wagmi';
import { Alert, AlertColor, Button, useTheme } from '@mui/material';
import { TransactionAlertStatus } from '../App';

type TransactionAlertProps = {
    status: TransactionAlertStatus
}

export default function TransactionAlert(props: TransactionAlertProps) {
    const theme = useTheme();

    if (props.status === TransactionAlertStatus.None) {
        return <></>;
    }

    let severity: AlertColor = "info";
    if (props.status === TransactionAlertStatus.Fail) {
        severity = "error";
    }
    else if (props.status === TransactionAlertStatus.Success) {
        severity = "success";
    }

    return (
        <Alert 
            severity={severity} 
            variant="outlined" 
            style={{
                position: 'absolute', 
                right: theme.spacing(2), 
                marginTop: theme.spacing(2)
            }}
        >
            Transaction {props.status}
        </Alert>
    )
}

