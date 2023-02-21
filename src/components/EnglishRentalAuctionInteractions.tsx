import { Button, Card, Grid, useTheme } from "@mui/material";
import { SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, ethers, Signer } from "ethers";
import { AbiCoder } from "ethers/lib/utils.js";
import React from "react";
import { useAccount, useSigner } from "wagmi";
import { ContinuousRentalAuction, EnglishRentalAuction } from "../graph/.graphclient";
import { cmpAddr, constants, GenericRentalAuctionWithMetadata, toFixedScientificNotation, waitForGraphSync } from "../helpers";
import BidBar from "./BidBar";
import FlowRateDisplay from "./FlowRateDisplay";
import PlaceBid from "./PlaceBid";

type EnglishRentalAuctionInteractionsProps = {
    genericRentalAuction: GenericRentalAuctionWithMetadata;
    englishRentalAuction: EnglishRentalAuction;
    superTokenSymbol: string;
    underlyingTokenSymbol: string;
    superTokenBalance: BigNumber;
    underlyingTokenBalance: BigNumber;

    superToken: SuperToken;

    afterTransaction: () => void;
};

export function EnglishRentalAuctionInteractions(props: EnglishRentalAuctionInteractionsProps) {
    const {address} = useAccount();
    const { data: signer, isError, isLoading } = useSigner();
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };
    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    
    const iHaveTopBid = cmpAddr(props.englishRentalAuction.topBidder, address || '');
    
    return (
        <>
            {/* if we are in bidding phase */}
            {/* we should display user's current bid, and a form to place a bid */}

            {/* if we are in renting phase */}
            {/* we should display a cancel lease button if user is the current renter */}

            {(() => {
                if (props.genericRentalAuction.paused) return <></>;

                if (props.englishRentalAuction.isBiddingPhase) {
                    return (
                        <>
                            {!iHaveTopBid ? null :
                                <Grid item xs={6}>
                                    <Card style={cardStyle} variant='outlined'>
                                        <h2>My Bid</h2>
                                        <p>Current Bid: <FlowRateDisplay flowRate={props.genericRentalAuction.topBid} currency={props.superTokenSymbol}/></p>
                                        <p>Deposit: {toFixedScientificNotation(props.genericRentalAuction.topBid * props.englishRentalAuction.minRentalDuration / 1e18)} {props.superTokenSymbol}</p>
                                    </Card>
                                </Grid>
                            }
                            <PlaceBid
                                config={{
                                    type: "create",
                                    gridWidth: iHaveTopBid ? 6 : 12,
                                    underlyingTokenSymbol: props.underlyingTokenSymbol,
                                    underlyingTokenBalance: props.underlyingTokenBalance,
                                    superTokenSymbol: props.superTokenSymbol,
                                    superTokenBalance: props.superTokenBalance,
                                    onUserFlowRateChange: setUserFlowRate,
                                    onBidClick: () => {}
                                }}
                            />
                        </>
                    );
                }
                else if (cmpAddr(props.genericRentalAuction.currentRenter, address || '')) {
                    return (
                        <Grid item xs={12}>
                            <Card style={cardStyle} variant='outlined'>
                                <h2>Cancel Lease</h2>
                                <p>(If you haven't passed the minimum rental duration you may forfeit a portion of your deposit)</p>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {}}
                                >
                                    Cancel Lease
                                </Button>
                            </Card>
                        </Grid>
                    );
                }
            })()}
        </>
    );
}
