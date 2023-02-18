import { ethers } from 'ethers';
import { ExecutionResult } from 'graphql';
import React from 'react';
import { useAccount } from 'wagmi';
import AuctionsList from '../components/AuctionsList';
import { ERC721ControllerObserversByOwnerDocument, ERC721ControllerObserversByOwnerQuery, execute, RentalAuctionsQuery } from '../graph/.graphclient';
import { convertControllersQueryToGenericRentalAuctions, GenericRentalAuction } from '../helpers';

export default function MyAuctions() {
  const { address } = useAccount();
  const [auctions, setAuctions] = React.useState<GenericRentalAuction[]>([]);

  const fetchMyAuctions = React.useCallback(async () => {
    if (!address) return;
    // todo: switch all as ExecutionResult to this way
    const controllersResult: ExecutionResult<ERC721ControllerObserversByOwnerQuery> = await execute(ERC721ControllerObserversByOwnerDocument, { owner: address })

    if (!controllersResult.data) throw new Error("No data returned from controllers query");
    console.log(controllersResult.data)

    setAuctions(convertControllersQueryToGenericRentalAuctions(controllersResult.data));
  }, [address]);

  React.useEffect(() => {
    fetchMyAuctions();
  }, [fetchMyAuctions]);

  return (
    <>
      <h1 style={{ display: 'flex', justifyContent: 'center' }}>My Auctions</h1>
      <AuctionsList genericRentalAuctions={auctions}/>
    </>
  );
}

