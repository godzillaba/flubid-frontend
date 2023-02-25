import { ethers } from "ethers";
import { useAccount, useNetwork } from "wagmi";
import { ChainId, cmpAddr, constants, GenericRentalAuctionWithMetadata, getControllerByImplementation, getSymbolOfSuperToken, makeOpenSeaLink } from "../helpers";
import FlowRateDisplay from "./FlowRateDisplay";

type ContinuousRentalAuctionInfoProps = {
    genericRentalAuction: GenericRentalAuctionWithMetadata
}

export function ContinuousRentalAuctionInfo(props: ContinuousRentalAuctionInfoProps) {
    const {address} = useAccount();
    const {chain} = useNetwork();
    const chainId = chain!.id as ChainId;

    const superTokenSymbol = getSymbolOfSuperToken(chainId, props.genericRentalAuction.acceptedToken);
    const auctionTypeReadable = constants.auctionTypesReadable[props.genericRentalAuction?.type];
    
    return (
        <>
            <h1 style={{ marginTop: 0 }}>{props.genericRentalAuction.controllerObserver.underlyingTokenName} #{props.genericRentalAuction.controllerObserver.underlyingTokenID}</h1>
            <sub>
                <a href={makeOpenSeaLink(props.genericRentalAuction.controllerObserver.underlyingTokenContract, props.genericRentalAuction.controllerObserver.underlyingTokenID)}>View on OpenSea</a>
            </sub>
            {/* <h2 style={{ marginTop: 0 }}>Auction Information</h2> */}
            <p>Currency: {superTokenSymbol}</p>
            <p>Auction Type: {auctionTypeReadable}</p>
            <p>Controller Type: {getControllerByImplementation(props.genericRentalAuction.controllerObserverImplementation).name}</p>

            <p>Paused: {props.genericRentalAuction.paused ? "Yes" : "No"}</p>
            <p>Auction Owner: {ethers.utils.getAddress(props.genericRentalAuction.controllerObserver.owner)}</p>
            <p>Beneficiary: {ethers.utils.getAddress(props.genericRentalAuction.beneficiary)}</p>

            <p>Top Bid: <FlowRateDisplay flowRate={props.genericRentalAuction.topBid / 1e18} currency={superTokenSymbol}/></p>
            <p>Current Renter: {cmpAddr(props.genericRentalAuction.currentRenter, address || '') ? "YOU" : ethers.utils.getAddress(props.genericRentalAuction.currentRenter)}</p>
        </>
    )
}