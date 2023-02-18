import React, { useEffect } from 'react';

import { Grid, TextField, useTheme } from '@mui/material';
import { Container } from '@mui/system';


import { execute, ExploreRentalAuctionsDocument, ExploreRentalAuctionsQuery, RentalAuctionsQuery } from "../graph/.graphclient";
import PageSpinner from '../components/PageSpinner';

import { constants, GenericRentalAuctionWithMetadata, fixIpfsUri, GenericRentalAuction, addMetadataToGenericRentalAuctions } from '../helpers';
import ExploreAuctionInfoCard from '../components/ExploreAuctionItemCard';
import { ExecutionResult } from 'graphql';

type AuctionsListProps = {
    genericRentalAuctions: GenericRentalAuction[]
}

export default function AuctionsList(props: AuctionsListProps) {
  
  const [auctionItems, setAuctionItems] = React.useState<GenericRentalAuctionWithMetadata[]>([]);

  useEffect(() => {
    addMetadataToGenericRentalAuctions(props.genericRentalAuctions).then(items => {
      setAuctionItems(items);
    })
  }, []);

  const theme = useTheme();

  if (auctionItems.length == 0) return <PageSpinner />

  return (
    <>
      {/* <Container>

        <h1 style={{ display: 'flex', justifyContent: 'center' }}>Explore Auctions</h1>
        <div style={{ marginBottom: theme.spacing(4) }}>
          <Grid container spacing={0}>
            <Grid item xs={2}></Grid>
            <Grid item xs={8}>
              <TextField fullWidth id="outlined-basic" label="Search by title or address" variant="outlined" />
            </Grid>
          </Grid>
        </div>
      </Container> */}
      <div style={{padding: theme.spacing(4)}}>

        <Grid container spacing={2}>
          {
            auctionItems.map((auctionItem, index) => (              
              <Grid item xs={2} key={index}>
                <ExploreAuctionInfoCard auctionItem={auctionItem}></ExploreAuctionInfoCard>
              </Grid>
            ))
          }
        </Grid>
      </div>
    </>
  );
}

