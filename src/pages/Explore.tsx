import React, { useEffect } from 'react';

import { Grid, TextField, useTheme } from '@mui/material';
import { Container } from '@mui/system';


import { execute, ExploreRentalAuctionsDocument, ExploreRentalAuctionsQuery, RentalAuctionsDocument, RentalAuctionsQuery } from "../graph/.graphclient";
import PageSpinner from '../components/PageSpinner';

import { constants, GenericRentalAuctionWithMetadata, fixIpfsUri, GenericRentalAuction } from '../helpers';
import ExploreAuctionInfoCard from '../components/ExploreAuctionItemCard';
import { ExecutionResult } from 'graphql';
import AuctionsList from '../components/AuctionsList';

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
  
  const [auctionItems, setAuctionItems]: [GenericRentalAuctionWithMetadata[], any] = React.useState([]);
  const [auctions, setAuctions] = React.useState<GenericRentalAuction[]>([]);

  useEffect(() => {
    execute(RentalAuctionsDocument, {where: {}}).then((result: ExecutionResult<RentalAuctionsQuery>) => {
      if (!result || !result.data) throw new Error("No data returned from rental auctions query");
      setAuctions(result.data.genericRentalAuctions);
    })
  }, []);

  const theme = useTheme();

  if (!auctions.length) return <PageSpinner />

  return (
    <>
      <h1 style={{ display: 'flex', justifyContent: 'center' }}>Explore Auctions</h1>
      <AuctionsList genericRentalAuctions={auctions}/>
    </>
  );
}

