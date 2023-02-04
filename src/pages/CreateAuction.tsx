import { Card, FormControl, FormGroup, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextareaAutosize, TextField, useTheme } from '@mui/material';
import React from 'react';
import FlowRateInput from '../components/FlowRateInput';

// function createContinuousRentalAuctionWithController(
//   ISuperToken _acceptedToken,
//   address _controllerObserverImplementation,
//   address _beneficiary,
//   uint96 _minimumBidFactorWad,
//   int96 _reserveRate,
//   bytes calldata _controllerObserverExtraArgs
// ) external returns (address auctionClone, address controllerObserverClone) {


export default function CreateAuction() {

  const theme = useTheme();
  const cardStyle = {
    padding: theme.spacing(2)
  };

  const [auctionType, setAuctionType] = React.useState('english');
  const [acceptedToken, setAcceptedToken] = React.useState('eth');

  const [reserveRate, setReserveRate] = React.useState(0);

  const handleAuctionTypeChange = (event: any) => {
    setAuctionType(event.target.value as string);
  };
  const handleAcceptedTokenChange = (event: any) => {
    setAcceptedToken(event.target.value as string);
  };

  const commonRentalAuctionOptions = (
    <>
      <TextField
        value={acceptedToken}
        onChange={handleAcceptedTokenChange}
        select
        label="Currency"
      >
        <MenuItem key={1} value="eth">ETH</MenuItem>
        <MenuItem key={2} value="dai">DAI</MenuItem>
      </TextField> <br/>

      <TextField label="Beneficiary Address" variant='outlined'/> <br/>

      <TextField label="Minimum Bid Factor" variant='outlined'/> <br/>
      
      Reserve Rate: 
      <FlowRateInput displayCurrency="DAI" displayResult onChange={setReserveRate}/>
    </>
  );
  // const englishRentalAuctionOptions = (

  // )

  return (
    <>
      <h1>Create Auction</h1>

      <FormControl fullWidth>
        <TextField label="Title" variant="outlined" />
        <br />
        <TextField label="Description" variant="outlined" />
        <br />
        <br />


        <TextField
          value={auctionType}
          onChange={handleAuctionTypeChange}
          select
          label="Auction Type"
        >
          <MenuItem key={1} value="english">
            English Rental Auction
          </MenuItem>
          <MenuItem key={2} value="continuous">
            Continuous Rental Auction
          </MenuItem>
        </TextField>

        <br/>

        {commonRentalAuctionOptions}
      </FormControl>
    </>

    // title + description

    // radio for auction type
    // select menu for acceptedToken
    // text input for beneficiary
    // number input for minBidFactor
    // number + select for reserveRate

    // new section for controller
    // radio for controllerObserver (4907, 4907Wrapper, Lens, basicpauseunpause, none)
    // different params for each

    // modal we have a 0 - 1 - 2 step indicator with a button underneath that says the current step (like approve and swap)
  );
}

