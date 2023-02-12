import React, { useEffect } from 'react';

import { Grid, TextField, useTheme } from '@mui/material';
import { Container } from '@mui/system';


import { execute, ExploreRentalAuctionsDocument, ExploreRentalAuctionsQuery } from "../graph/.graphclient";
import PageSpinner from '../components/PageSpinner';

import { constants, fixIpfsUri, getItemsFromRentalAuctionsDocument } from '../helpers';
import ExploreAuctionInfoCard from '../components/ExploreAuctionItemCard';

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
  const [auctionItems, setAuctionItems] = React.useState([]);

  useEffect(() => {
    execute(ExploreRentalAuctionsDocument, { first: 12, skip: 0 }).then((result) => {
      getItemsFromRentalAuctionsDocument(result?.data?.rentalAuctions).then(setAuctionItems)
    })
  }, []);

  const theme = useTheme();

  if (auctionItems.length == 0) return <PageSpinner />

  return (
    <>
      <Container>

        <h1 style={{ display: 'flex', justifyContent: 'center' }}>Explore Auctions</h1>
        <div style={{ marginBottom: theme.spacing(4) }}>
          <Grid container spacing={0}>
            <Grid item xs={2}></Grid>
            <Grid item xs={8}>
              <TextField fullWidth id="outlined-basic" label="Search by title or address" variant="outlined" />
            </Grid>
          </Grid>
        </div>
      </Container>

      <div style={{ padding: theme.spacing(8) }}>
        <Grid container spacing={2}>
          {
            auctionItems.map((auctionItem, index) => (              
              <Grid item xs={12} md={2} key={index}>
                <ExploreAuctionInfoCard auctionItem={auctionItem}></ExploreAuctionInfoCard>
              </Grid>
            ))
          }
        </Grid>
      </div>
    </>
  );
}

