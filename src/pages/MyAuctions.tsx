import { ExecutionResult } from 'graphql';
import React from 'react';
import { useAccount } from 'wagmi';
import { ERC721ControllerObserversByOwnerDocument, ERC721ControllerObserversByOwnerQuery, execute, RentalAuctionsQuery } from '../graph/.graphclient';
import { convertControllersQueryToGenericRentalAuctions } from '../helpers';

export default function MyAuctions() {
  const { address } = useAccount();
  const [queryResult, setQueryResult] = React.useState<RentalAuctionsQuery>();
  const fetchMyAuctions = React.useCallback(async () => {
    const controllersResult: ExecutionResult<ERC721ControllerObserversByOwnerQuery> = await execute(ERC721ControllerObserversByOwnerDocument, { where: { owner: address } })
    // we need to transform controllersResult into a RentalAuctionsQuery
    // so we can use the same component to display the auctions

    if (!controllersResult.data) throw new Error("No data returned from controllers query");

    const auctions = convertControllersQueryToGenericRentalAuctions(controllersResult.data);

  }, [address]);
  return (
    <h1>My Auctions</h1>
  );
}

