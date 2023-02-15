import { Button, Card, CircularProgress, Grid, useTheme } from '@mui/material';
import { Stack } from '@mui/system';
import { BigNumber } from 'ethers';
import React from 'react';
import FlowRateInput from './FlowRateInput';

type PlaceBidConfig = {
    gridWidth: 6 | 12,
    type: 'create' | 'update',
    underlyingTokenSymbol: string,
    underlyingTokenBalance: BigNumber,
    superTokenSymbol: string,
    superTokenBalance: BigNumber,
    onUserFlowRateChange: (val: number) => any,
    onBidClick: () => any
}

type PlaceBidProps = {
    config: PlaceBidConfig
}

export default function PlaceBid(props: PlaceBidProps) {
    const theme = useTheme();
    const config = props.config;

    const cardStyle = {
        padding: theme.spacing(2),
    };

    const title = config.type === 'create' ? "Place Bid" : "Update Bid";

    return (
        <Grid item xs={config.gridWidth}>
            <Card variant="outlined" style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>{title}</h2>
                <p>{config.underlyingTokenSymbol} Balance: {parseInt(config.underlyingTokenBalance.toString())/1e18}</p>
                <p>{config.superTokenSymbol} Balance: {parseInt(config.superTokenBalance.toString())/1e18}</p>
                <FlowRateInput displayCurrency="DAI" onChange={config.onUserFlowRateChange}/>
                <br />
                <Button fullWidth variant="outlined" color="success" onClick={config.onBidClick}>
                    {title}
                </Button>
            </Card>
        </Grid>
    );
}

