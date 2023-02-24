import { Button, Card, Grid, useTheme } from "@mui/material";
import { Framework, Operation, SuperToken } from "@superfluid-finance/sdk-core";
import { BigNumber, BigNumberish, ethers, Signer } from "ethers";
import { AbiCoder } from "ethers/lib/utils.js";
import React from "react";
import { useAccount, useSigner } from "wagmi";
import { ContinuousRentalAuction, EnglishRentalAuction } from "../graph/.graphclient";
import { cmpAddr, constants, currentTime, GenericRentalAuctionWithMetadata, toFixedScientificNotation, waitForGraphSync } from "../helpers";
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
    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    
    const iHaveTopBid = cmpAddr(props.englishRentalAuction.topBidder, address || '');
    const canTransitionToRentalPhase = !props.genericRentalAuction.paused && props.englishRentalAuction.isBiddingPhase && currentTime() >= props.englishRentalAuction.currentPhaseEndTime;
    const canTransitionToBiddingPhase = !props.genericRentalAuction.paused && !props.englishRentalAuction.isBiddingPhase && currentTime() >= props.englishRentalAuction.currentPhaseEndTime;

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

        console.log('placeBid')

        const isApprovedERC20Result = await isApprovedERC20(calculateDepositSize(userFlowRateBigInt()));
        const isApprovedFlowOperatorResult = await isApprovedFlowOperator(userFlowRateBigInt());

        console.log(isApprovedERC20Result, isApprovedFlowOperatorResult)

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
        const tx = await batchCall.exec(signer);
        const receipt = await tx.wait();

        await waitForGraphSync(receipt.blockNumber);

        props.afterTransaction();
    }

    async function transitionToRentalPhase() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const auctionContract = EnglishRentalAuction__factory.connect(props.genericRentalAuction.address, signer);
        const tx = await auctionContract.transitionToRentalPhase();
        const receipt = await tx.wait();
        await waitForGraphSync(receipt.blockNumber);
        props.afterTransaction();
    }

    async function transitionToBiddingPhase() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const auctionContract = EnglishRentalAuction__factory.connect(props.genericRentalAuction.address, signer);
        const tx = await auctionContract.transitionToBiddingPhase();
        const receipt = await tx.wait();
        await waitForGraphSync(receipt.blockNumber);
        props.afterTransaction();
    }

    // this is a debugging function
    async function approveFlowOperator() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const op = props.superToken.authorizeFlowOperatorWithFullControl({
            flowOperator: props.genericRentalAuction.address as string,
            userData: "0x"
        });

        const tx = await op.exec(signer);

        const receipt = await tx.wait();
        await waitForGraphSync(receipt.blockNumber);
        props.afterTransaction();
    }

    // this is a debugging function
    async function revokeFlowOperator() {
        if (!signer || !address) throw new Error("Signer or address undefined");

        const op = props.superToken.revokeFlowOperatorWithFullControl({
            flowOperator: props.genericRentalAuction.address as string,
            userData: "0x"
        });

        const tx = await op.exec(signer);

        const receipt = await tx.wait();
        await waitForGraphSync(receipt.blockNumber);
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
                                <p>(If you haven't passed the minimum rental duration you may forfeit a portion of your deposit)</p>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {throw new Error("todo")}}
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