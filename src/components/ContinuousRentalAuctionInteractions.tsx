import { Button, Card, Grid, useTheme } from "@mui/material";
import { SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, ethers, Signer } from "ethers";
import { AbiCoder } from "ethers/lib/utils.js";
import React from "react";
import { useAccount, useSigner } from "wagmi";
import { ContinuousRentalAuction } from "../graph/.graphclient";
import { constants, GenericRentalAuctionWithMetadata, waitForGraphSync } from "../helpers";
import BidBar from "./BidBar";
import FlowRateDisplay from "./FlowRateDisplay";
import PlaceBid from "./PlaceBid";

type ContinuousRentalAuctionInteractionsProps = {
    genericRentalAuction: GenericRentalAuctionWithMetadata;
    continuousRentalAuction: ContinuousRentalAuction;
    superTokenSymbol: string;
    underlyingTokenSymbol: string;
    superTokenBalance: BigNumber;
    underlyingTokenBalance: BigNumber;

    superToken: SuperToken;

    afterTransaction: () => void;
};

function findBidderAbove(bids: ContinuousRentalAuction["inboundStreams"], bidAmount: BigNumber, ignoreSender: string): string {
    const sortedBids = bids.sort((a, b) => BigNumber.from(a.flowRate).sub(BigNumber.from(b.flowRate)).lt(0) ? -1 : 1);
    
    const foundBid = sortedBids.find(bid => BigNumber.from(bid.flowRate).gte(BigNumber.from(bidAmount)) && bid.sender != ignoreSender);
    console.log(foundBid?.sender || constants.zeroAddress)
    
    return foundBid?.sender || constants.zeroAddress;
}

export function ContinuousRentalAuctionInteractions(props: ContinuousRentalAuctionInteractionsProps) {
    const {address} = useAccount();
    const { data: signer, isError, isLoading } = useSigner();
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };
    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    const myContinuousBid = props.continuousRentalAuction?.inboundStreams.find(x => ethers.utils.getAddress(x.sender) === address);
    const positionInBidQueue = props.continuousRentalAuction?.inboundStreams.sort((a, b) => b.flowRate - a.flowRate).map(x => x.sender).indexOf(address?.toLowerCase());


    async function continuousCreateUpdateOrDeleteBid(kind: 'create' | 'update' | 'delete') {
        if (!props.superToken || !props.continuousRentalAuction || !address) throw new Error("stuff is undefined");
        
        let flowOp;
        if (kind === 'delete') {
            flowOp = props.superToken.deleteFlow({
                sender: address as string,
                receiver: props.genericRentalAuction?.address
            });
        }
        else {
            const flowRate = BigNumber.from(Math.round(userFlowRate * 1e18) + "");
            const higherBidder = findBidderAbove(props.continuousRentalAuction.inboundStreams, flowRate, address);
            const flowOpParams = {
                sender: address as string,
                receiver: props.genericRentalAuction?.address,
                flowRate: Math.round(userFlowRate * 1e18) + "",
                userData: new AbiCoder().encode(["address", "bytes"], [higherBidder, []])
            };
            if (kind === 'create') {
                flowOp = props.superToken.createFlow(flowOpParams);
            }
            else {
                flowOp = props.superToken.updateFlow(flowOpParams);
            }
        }
        const tx = await (await flowOp.exec(signer as Signer)).wait();
        await waitForGraphSync(tx.blockNumber);
        
        props.afterTransaction();
    }

    
    return (
        <>
            {props.genericRentalAuction.topBid == 0 || props.genericRentalAuction.paused ? null : (
                <Grid item xs={12}>
                    <BidBar
                        bids={props.continuousRentalAuction.inboundStreams.map((s) => Number(s.flowRate))}
                        currentBid={userFlowRate * 1e18}
                    />
                </Grid>
            )}
            {!myContinuousBid ? null : (
                <Grid item xs={6}>
                    <Card variant="outlined" style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Your Bid</h2>
                        <p>
                            <FlowRateDisplay flowRate={myContinuousBid.flowRate / 1e18} currency={props.superTokenSymbol} />
                        </p>
                        {positionInBidQueue != undefined ? (
                            <p>Position in bid queue: {positionInBidQueue + 1}</p>
                        ) : null}
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => {
                                continuousCreateUpdateOrDeleteBid("delete");
                            }}
                        >
                            Cancel Bid
                        </Button>
                    </Card>
                </Grid>
            )}

            {props.genericRentalAuction.paused ? null :
                <PlaceBid
                    config={{
                        type: myContinuousBid ? "update" : "create",
                        gridWidth: myContinuousBid ? 6 : 12,
                        underlyingTokenSymbol: props.underlyingTokenSymbol,
                        underlyingTokenBalance: props.underlyingTokenBalance,
                        superTokenSymbol: props.superTokenSymbol,
                        superTokenBalance: props.superTokenBalance,
                        onUserFlowRateChange: setUserFlowRate,
                        onBidClick: myContinuousBid
                            ? () => {
                                continuousCreateUpdateOrDeleteBid("update");
                            }
                            : () => {
                                continuousCreateUpdateOrDeleteBid("create");
                            },
                    }}
                />
            }
        </>
    );
}
