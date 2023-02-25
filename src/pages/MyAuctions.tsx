import { ethers } from 'ethers';
import { ExecutionResult } from 'graphql';
import React from 'react';
import { useAccount, useNetwork } from 'wagmi';
import AuctionsList from '../components/AuctionsList';
import { ChainId, constants, convertControllersQueryToGenericRentalAuctions, GenericRentalAuction, getGraphSDK } from '../helpers';

export default function MyAuctions() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = chain!.id as ChainId;
  const [auctions, setAuctions] = React.useState<GenericRentalAuction[]>([]);

  const fetchMyAuctions = React.useCallback(async () => {
    if (!address) return;
    
    const graphSdk = getGraphSDK(chainId);

    const controllersResult = await graphSdk.ERC721ControllerObserversByOwner({ owner: address });

    setAuctions(convertControllersQueryToGenericRentalAuctions(controllersResult));
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

