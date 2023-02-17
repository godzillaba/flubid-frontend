import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { execute, RentalAuctionByAddressDocument } from '../graph/.graphclient';
import { getItemsFromRentalAuctionsDocument } from '../helpers';

export default function ManageAuction() {
    const { auctionAddress } = useParams();
    const navigate = useNavigate();

    const {address} = useAccount();

    // get auction data
    const fetchAuctionData = React.useCallback(async () => {
        if (!auctionAddress) return;
        const rentalAuctionResult = await execute(RentalAuctionByAddressDocument, { address: auctionAddress }) as any;

        if (rentalAuctionResult.controllerObserver.owner !== address) {
            navigate('/auctions/' + auctionAddress);
            return;
        }

        const auctions = await getItemsFromRentalAuctionsDocument(rentalAuctionResult.data);
    }, [auctionAddress]);
    
    return (
        <>
            Manage Auction
        </>
    )
}