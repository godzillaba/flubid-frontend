import { Button, Card, Grid, useTheme } from "@mui/material";
import { Framework, Operation, SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, BigNumberish, ethers, Signer } from "ethers";
import { AbiCoder } from "ethers/lib/utils.js";
import React from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { MyContext, TransactionAlertStatus } from "../App";
import { ContinuousRentalAuction, EnglishRentalAuction } from "../graph/.graphclient";
import { ChainId, cmpAddr, constants, currentTime, GenericRentalAuctionWithMetadata, prettyDuration, toFixedScientificNotation, waitForGraphSync, waitForTxPromise } from "../helpers";
import { EnglishRentalAuction__factory } from "../types";
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

    sfFramework: Framework;
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

    const { setTransactionAlertStatus } = React.useContext(MyContext);

    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    
    const iHaveTopBid = cmpAddr(props.englishRentalAuction.topBidder, address || '');
    const canTransitionToRentalPhase = 
        !props.genericRentalAuction.paused && 
        props.englishRentalAuction.isBiddingPhase && 
        props.englishRentalAuction.currentPhaseEndTime > 0 && 
        currentTime() >= props.englishRentalAuction.currentPhaseEndTime;
    
    const canTransitionToBiddingPhase = 
        !props.genericRentalAuction.paused && 
        !props.englishRentalAuction.isBiddingPhase && 
        currentTime() >= props.englishRentalAuction.currentPhaseEndTime;

    const rentalStartTime = props.englishRentalAuction.currentPhaseEndTime - props.englishRentalAuction.maxRentalDuration;
    const timeTillMinRentalDuration = rentalStartTime + parseInt(props.englishRentalAuction.minRentalDuration) - currentTime();

    console.log(props.englishRentalAuction)

    function calculateDepositSize(flowRate: BigNumber) {
        // return ethers.constants.MaxUint256;
        return BigNumber.from(flowRate).mul(props.englishRentalAuction.minRentalDuration);
    }

    function userFlowRateBigInt() {
        return BigNumber.from(Math.floor(userFlowRate * 1e18) + '');
    }
    
    function approveERC20Operation(amount: BigNumber) {
        return props.superToken.approve({
            receiver: props.genericRentalAuction.address,
            amount: amount.toHexString()
        });
    }

    function approveFlowOperatorOperation() {
        // todo: doesn't need to be full control
        return props.superToken.authorizeFlowOperatorWithFullControl({
            flowOperator: props.genericRentalAuction.address as string,
            userData: "0x"
        });
    }

    function callSuperAppOperation() {
        const iface = EnglishRentalAuction__factory.createInterface();
        const calldata = iface.encodeFunctionData("placeBid(int96,bytes)", [userFlowRateBigInt(), "0x"]);
        return props.sfFramework.host.callAppAction(
            props.genericRentalAuction.address,
            calldata
        );
    }

    async function isApprovedERC20(amount: BigNumberish) {
        if (!signer || !address) throw new Error("Signer or address undefined");
        // const allowance = await props.superToken.allowance(address || '', props.genericRentalAuction.controllerObserver.address, signer as Signer);
        const allowance = await props.superToken.allowance({
            owner: address,
            spender: props.genericRentalAuction.address as string,
            providerOrSigner: signer
        });
        return BigNumber.from(allowance).gte(amount);
    }

    async function isApprovedFlowOperator(rate: BigNumberish) {
        if (!signer || !address) throw new Error("Signer or address undefined");
        const operatorData = await props.superToken.getFlowOperatorData({
            flowOperator: props.genericRentalAuction.address,
            sender: address,
            providerOrSigner: signer
        });

        const permissions = parseInt(operatorData.permissions);

        return BigNumber.from(operatorData.flowRateAllowance).gte(rate) && permissions === 7; // todo, doesn't need to have update permission
    }

    async function placeBid() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        try {
            setTransactionAlertStatus(TransactionAlertStatus.Pending);

            const isApprovedERC20Result = await isApprovedERC20(calculateDepositSize(userFlowRateBigInt()));
            const isApprovedFlowOperatorResult = await isApprovedFlowOperator(userFlowRateBigInt());
            
            const ops: Operation[] = [];
            
            if (!isApprovedERC20Result) {
                ops.push(approveERC20Operation(calculateDepositSize(userFlowRateBigInt())));
            }
            
            if (!isApprovedFlowOperatorResult) {
                ops.push(approveFlowOperatorOperation());
            }
            
            ops.push(callSuperAppOperation());
            
            console.log(ops);
            
            const batchCall = props.sfFramework.batchCall(ops);

            await waitForTxPromise(batchCall.exec(signer), setTransactionAlertStatus);

            props.afterTransaction();
        }
        catch(e) {
            setTransactionAlertStatus(TransactionAlertStatus.Fail);
            throw e;
        }
    }

    async function cancelLease() {
        if (!signer || !address) throw new Error("Signer or address undefined");
        const flowOp = props.superToken.deleteFlow({
            sender: address,
            receiver: props.genericRentalAuction?.address
        });

        await waitForTxPromise(flowOp.exec(signer), setTransactionAlertStatus);
        props.afterTransaction();
    }

    async function transitionToRentalPhase() {
        if (!signer || !address) throw new Error("Signer or address undefined");
        const auctionContract = EnglishRentalAuction__factory.connect(props.genericRentalAuction.address, signer);
        await waitForTxPromise(auctionContract.transitionToRentalPhase(), setTransactionAlertStatus);
        props.afterTransaction();
    }

    async function transitionToBiddingPhase() {
        if (!signer || !address) throw new Error("Signer or address undefined");
        const auctionContract = EnglishRentalAuction__factory.connect(props.genericRentalAuction.address, signer);
        await waitForTxPromise(auctionContract.transitionToBiddingPhase(), setTransactionAlertStatus);
        props.afterTransaction();
    }

    // this is a debugging function
    async function approveFlowOperator() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const op = props.superToken.authorizeFlowOperatorWithFullControl({
            flowOperator: props.genericRentalAuction.address as string,
            userData: "0x"
        });

        await waitForTxPromise(op.exec(signer), setTransactionAlertStatus);

        props.afterTransaction();
    }

    // this is a debugging function
    async function revokeFlowOperator() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const op = props.superToken.revokeFlowOperatorWithFullControl({
            flowOperator: props.genericRentalAuction.address as string,
            userData: "0x"
        });

        await waitForTxPromise(op.exec(signer), setTransactionAlertStatus);
        props.afterTransaction();
    }
    
    return (
        <>
            {/* if we are in bidding phase */}
            {/* we should display user's current bid, and a form to place a bid */}

            {/* if we are in renting phase */}
            {/* we should display a cancel lease button if user is the current renter */}

            {canTransitionToRentalPhase ? 
                <Grid item xs={12}>
                    <Card style={cardStyle} variant='outlined'>
                        <p>Bidding phase has expired. Click to start the rental.</p>
                        <Button variant='outlined' color='success' onClick={transitionToRentalPhase}>Start Rental</Button>
                    </Card>
                </Grid>
            : null}

            {canTransitionToBiddingPhase ? 
                <Grid item xs={12}>
                    <Card style={cardStyle} variant='outlined'>
                        <p>Rental has expired. Click to start bidding phase.</p>
                        <Button variant='outlined' color='success' onClick={transitionToBiddingPhase}>Start Bidding</Button>
                    </Card>
                </Grid>
            : null}

            {(() => {
                if (props.genericRentalAuction.paused) return <></>;

                if (props.englishRentalAuction.isBiddingPhase) {
                    return (
                        <>
                            {!iHaveTopBid ? null :
                                <Grid item xs={6}>
                                    <Card style={cardStyle} variant='outlined'>
                                        <h2>My Bid</h2>
                                        <p>Current Bid: <FlowRateDisplay flowRate={toFixedScientificNotation(props.genericRentalAuction.topBid / 1e18)} currency={props.superTokenSymbol}/></p>
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
                                    onBidClick: placeBid
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
                                {/* <p>(If you haven't passed the minimum rental duration you may forfeit a portion of your deposit)</p> */}
                                {timeTillMinRentalDuration > 0 ?
                                    <>
                                        <p>You have {prettyDuration(timeTillMinRentalDuration)} until the minimum rental duration elapses.</p>
                                        <p>If you cancel your lease now, you will forfeit some of your deposit.</p>
                                    </>
                                : null}
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={cancelLease}
                                >
                                    Cancel Lease
                                </Button>
                            </Card>
                        </Grid>
                    );
                }
            })()}

            {/* <Button onClick={transitionToRentalPhase}>Transition to rental phase</Button>
            <Button onClick={approveFlowOperator}>Approve flow operator</Button>
            <Button onClick={revokeFlowOperator}>Revoke flow operator</Button> */}
        </>
    );
}
