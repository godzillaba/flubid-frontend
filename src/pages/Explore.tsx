import React, { useEffect } from 'react';

import { Grid, TextField, useTheme } from '@mui/material';
import { Container } from '@mui/system';


import { execute, ExploreRentalAuctionsDocument, ExploreRentalAuctionsQuery, RentalAuctionsDocument, RentalAuctionsQuery } from "../graph/.graphclient";
import PageSpinner from '../components/PageSpinner';

import { constants, GenericRentalAuctionWithMetadata, fixIpfsUri, GenericRentalAuction, ChainId, getGraphSDK } from '../helpers';
import ExploreAuctionInfoCard from '../components/ExploreAuctionItemCard';
import { ExecutionResult } from 'graphql';
import AuctionsList from '../components/AuctionsList';

import { useNetwork } from 'wagmi';


// async function getItemsFromRentalAuctionsDocument(rentalAuctions: any) {
//   if (!rentalAuctions) return;

//   const auctions = rentalAuctions.filter((auction: any) => constants.officialControllerImpls.includes(auction.controllerObserverImplementation));

//   const metadatas = await Promise.all(auctions.map((auction:any) => {
//     const uri = auction.underlyingTokenURI;
//     return fetch(fixIpfsUri(uri)).then(res => res.json()).catch(() => { return {} });
//   }));


//   return auctions.map((auction: any, index: any) => {
//     return {
//       ...auction,
//       metadata: metadatas[index]
//     }
//   });
// }

export default function Explore() {
  const {chain} = useNetwork();
  const chainId = chain!.id as ChainId;
  const [auctions, setAuctions] = React.useState<GenericRentalAuction[]>();

  const sdk = getGraphSDK(chainId);

  useEffect(() => {
    setAuctions(undefined);
    sdk.ExploreRentalAuctions().then((result) => {
      setAuctions(result.genericRentalAuctions);
    }).catch((err) => {
      console.error(err);
    });
  }, [chainId]);

  if (!auctions) return <PageSpinner />

  return (
    <>
      <h1 style={{ display: 'flex', justifyContent: 'center' }}>Explore Auctions</h1>
      {auctions.length === 0 ? <h2 style={{ display: 'flex', justifyContent: 'center' }}>No Auctions Found</h2> : <AuctionsList genericRentalAuctions={auctions}/>}
    </>
  );
}

