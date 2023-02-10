import React, { useEffect } from 'react';

import { Button, Card, CircularProgress, Divider, Grid, TextField, useTheme } from '@mui/material';
import { Container } from '@mui/system';

import { useNavigate } from 'react-router-dom';

import { execute, ExploreContinuousRentalAuctionsDocument, ExploreContinuousRentalAuctionsQuery } from "../graph/.graphclient";
import PageSpinner from '../components/PageSpinner';

import { readContracts, useProvider } from 'wagmi';
import { AbiCoder } from 'ethers/lib/utils.js';
import { BigNumber, ethers } from 'ethers';

import {Buffer} from "buffer";

import {default as continuousRentalAuctionAbi} from "../abi/ContinuousRentalAuction.json";
import {default as controllerObserverAbi} from "../abi/IRentalAuctionControllerObserver.json";
import {default as erc721MetadataAbi} from "../abi/IERC721Metadata.json";
import { constants, fixIpfsUri } from '../helpers';
import ExploreAuctionInfoCard from '../components/ExploreAuctionItemCard';

async function getItemsFromRentalAuctionsDocument(data: any) {
  if (!data) return;
  console.log(data)
  const auctions = data.continuousRentalAuctions.filter((auction: any) => constants.officialControllerImpls.includes(auction.controllerObserverImplementation));

  const underlyingContractsReqs = auctions.map((auction: any) => {
    return {
      address: auction.controllerObserver,
      abi: controllerObserverAbi.abi,
      functionName: "underlyingTokenContract"
    }
  });

  const underlyingIdsReqs = auctions.map((auction: any) => {
    return {
      address: auction.controllerObserver,
      abi: controllerObserverAbi.abi,
      functionName: "underlyingTokenID"
    }
  });

  const underlyingContracts = await readContracts({contracts: underlyingContractsReqs}) as string[];
  const underlyingIds = await readContracts({contracts: underlyingIdsReqs}) as string[];

  const tokenURIReqs = underlyingContracts.map((contractAddress: any, index: any) => {
    return {
      address: contractAddress,
      abi: erc721MetadataAbi.abi,
      functionName: "tokenURI",
      args: [Number(underlyingIds[index])]
    }
  });

  const tokenNameReqs = underlyingContracts.map((contractAddress: any) => {
    return {
      address: contractAddress,
      abi: erc721MetadataAbi.abi,
      functionName: "name"
    }
  });

  const metadataURIs = await readContracts({contracts: tokenURIReqs}) as string[];
  const metadatas = await Promise.all(metadataURIs.map(uri => {
    return fetch(fixIpfsUri(uri)).then(res => res.json()).catch(() => { return {} });
  }));

  const names = await readContracts({contracts: tokenNameReqs}) as string[];

  return auctions.map((auction: any, index: any) => {
    return {
      ...auction,
      metadata: metadatas[index],
      name: names[index],
      underlyingTokenContract: underlyingContracts[index],
      underlyingTokenId: Number(underlyingIds[index]),
      auctionType: "Continuous Rental Auction" // todo: when english are integrated into frontend we have to change some stuff around here
    }
  });
}


export default function Explore() {
  const [auctionItems, setAuctionItems] = React.useState([]);

  useEffect(() => {
    execute(ExploreContinuousRentalAuctionsDocument, { first: 12, skip: 0 }).then((result) => {
      getItemsFromRentalAuctionsDocument(result?.data).then(setAuctionItems)
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

