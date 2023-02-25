import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { EnglishRentalAuction } from "../graph/.graphclient";
import { cmpAddr, constants, formattedDateStringFromSeconds, GenericRentalAuctionWithMetadata, getControllerByImplementation, getSymbolOfSuperToken, makeOpenSeaLink, prettyDuration } from "../helpers";
import FlowRateDisplay from "./FlowRateDisplay";

type EnglishRentalAuctionInfoProps = {
    genericRentalAuction: GenericRentalAuctionWithMetadata,
    englishRentalAuction: EnglishRentalAuction
}

export function EnglishRentalAuctionInfo(props: EnglishRentalAuctionInfoProps) {
    const superTokenSymbol = getSymbolOfSuperToken('polygonMumbai', props.genericRentalAuction.acceptedToken);
    const auctionTypeReadable = constants.auctionTypesReadable[props.genericRentalAuction?.type];

    const {address} = useAccount();

    const rentalStartTime = props.englishRentalAuction.currentPhaseEndTime - props.englishRentalAuction.maxRentalDuration;
    
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

            <p>Auction Owner: {ethers.utils.getAddress(props.genericRentalAuction.controllerObserver.owner)}</p>
            <p>Beneficiary: {ethers.utils.getAddress(props.genericRentalAuction.beneficiary)}</p>
            
            <p>Minimum Rental Duration: {prettyDuration(props.englishRentalAuction.minRentalDuration)}</p>
            <p>Maximum Rental Duration: {prettyDuration(props.englishRentalAuction.maxRentalDuration)}</p>
            <p>Bidding Phase Duration: {prettyDuration(props.englishRentalAuction.biddingPhaseDuration)}</p>
            <p>Bidding Phase Extension Duration: {prettyDuration(props.englishRentalAuction.biddingPhaseExtensionDuration)}</p>

            <p>Current Phase: {(() => {
                if (props.genericRentalAuction.paused) return "Paused";
                if (props.englishRentalAuction.isBiddingPhase) return "Bidding";
                return "Renting";
            })()}</p>
            
            <p>Current Phase End Time: {
                props.englishRentalAuction.currentPhaseEndTime == 0 ? "\u{221E}" : 
                formattedDateStringFromSeconds(props.englishRentalAuction.currentPhaseEndTime) + " (" + prettyDuration(props.englishRentalAuction.currentPhaseEndTime - Math.floor(Date.now() / 1000)) + ")"
            }</p>

            {/* if renting, show current renter and rent. if bidding, show top bidder and top bid */}

            {(() => {
                if (props.genericRentalAuction.paused) return <></>;
                console.log(props.genericRentalAuction)
                if (props.englishRentalAuction.isBiddingPhase) {
                    return (
                        <>
                            <p>Top Bidder: {cmpAddr(props.englishRentalAuction.topBidder, address || '') ? "YOU" : ethers.utils.getAddress(props.englishRentalAuction.topBidder)}</p>
                            <p>Top Bid: <FlowRateDisplay flowRate={props.genericRentalAuction.topBid / 1e18} currency={superTokenSymbol}/></p>
                        </>
                    )
                }

                return (
                    <>
                        <p>Current Renter: {cmpAddr(props.genericRentalAuction.currentRenter, address || '') ? "YOU" : ethers.utils.getAddress(props.genericRentalAuction.currentRenter)}</p>
                        <p>Rental Start Time: {formattedDateStringFromSeconds(rentalStartTime)}</p>
                        <p>Current Rent: <FlowRateDisplay flowRate={props.genericRentalAuction.topBid / 1e18} currency={superTokenSymbol}/></p>
                    </>
                )
            })()}
        </>
    )
}