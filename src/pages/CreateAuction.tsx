import { FormControl, MenuItem, Container, TextField, useTheme, Button, Stack } from '@mui/material';
import React, { Reducer } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite, useSigner } from 'wagmi'
import FlowRateInput from '../components/FlowRateInput';
import { constants, getSuperTokenAddressFromSymbol } from '../helpers';
import * as continuousRentalAuctionFactoryABIJson from "../abi/ContinuousRentalAuctionFactory.json"
import { ethers } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils.js';

const continuousRentalAuctionFactoryABI = continuousRentalAuctionFactoryABIJson;

function reducer(state: Inputs, update: InputsUpdate) {
  return { ...state, [update.name]: update.value };
}

type Inputs = {
  auctionType: string,
  acceptedToken: string, // todo multichain
  reserveRate: string,
  beneficiary: string,
  minimumBidFactor: string,

  controllerObserverImplementation: string,
  underlyingTokenAddress: string,
  underlyingTokenID: string
};

type InputsUpdate = {
  name: string,
  value: string
}

export default function CreateAuction() {

  const {address} = useAccount();
  const { data: signer, isError, isLoading } = useSigner();
  

  const theme = useTheme();
  const cardStyle = {
    padding: theme.spacing(2)
  };

  const [inputs, updateInputs] = React.useReducer<Reducer<Inputs, InputsUpdate>>(reducer, {
    auctionType: 'continuous',
    acceptedToken: 'MATICx',
    reserveRate: '0',
    beneficiary: address || constants.zeroAddress,
    minimumBidFactor: '1.05',

    controllerObserverImplementation: '',
    underlyingTokenAddress: '',
    underlyingTokenID: ''
  })

  function handleInputChange(event: any) {
    const { name, value } = event.target;
    updateInputs({ name, value });
  }

  async function create() {
    if (!signer) return;
    const factoryContract = new ethers.Contract(constants.continuousRentalAuctionFactory, continuousRentalAuctionFactoryABI.abi, signer);
    
    const params = [
      getSuperTokenAddressFromSymbol('polygonMumbai', inputs.acceptedToken),
      inputs.controllerObserverImplementation === 'ERC4907ControllerObserver' ? constants.erc4907ControllerImpl : constants.lensControllerImpl,
      inputs.beneficiary,
      ethers.BigNumber.from(Math.floor(Number(inputs.minimumBidFactor) * 1e18) + ''),
      ethers.BigNumber.from(Math.floor(Number(inputs.reserveRate) * 1e18) + ''),
      new AbiCoder().encode(['address', 'uint256'], [ethers.utils.getAddress(inputs.underlyingTokenAddress), inputs.underlyingTokenID])
    ]

    console.log(params)

    const tx = await factoryContract.functions.create(...params);
    console.log(tx);
  }

  return (
    <Container>
      <h1>Create Auction</h1>

      {JSON.stringify(inputs)}

      <FormControl fullWidth>
        <TextField
          value={inputs.auctionType}
          name="auctionType"
          onChange={handleInputChange}
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

        <TextField
          value={inputs.acceptedToken}
          name="acceptedToken"
          onChange={handleInputChange}
          select
          label="Currency"
        >
          <MenuItem key={1} value="MATICx">MATICx</MenuItem>
          <MenuItem key={2} value="DAIx">DAIx</MenuItem>
        </TextField> <br/>

        <TextField 
          label="Beneficiary Address" 
          variant='outlined'
          name="beneficiary"
          value={inputs.beneficiary}
          onChange={handleInputChange}
        /> 
        <br/>

        <TextField 
          label="Minimum Bid Factor" 
          variant='outlined'
          name="minimumBidFactor"
          value={inputs.minimumBidFactor}
          onChange={handleInputChange}
        />
        <br/>
        
        Reserve Rate: 
        <FlowRateInput displayCurrency="DAI" displayResult onChange={value => updateInputs({name: "reserveRate", value: value.toString()})}/>
        
        <br/><br/>
        
        <h2>Controller Parameters</h2>

        <TextField
          value={inputs.controllerObserverImplementation}
          name="controllerObserverImplementation"
          onChange={handleInputChange}
          select
          label="Controller Observer Type"
        >
          <MenuItem key={1} value="ERC4907ControllerObserver">
            ERC4907 Controller Observer
          </MenuItem>
          <MenuItem key={2} value="LensControllerObserver">
            Lens Profile Controller Observer
          </MenuItem>
        </TextField>

        <br/>

        {/* todo: hide + autofill for lens */}
        <Stack direction="row" spacing={2}>
          <TextField 
            fullWidth
            label="Underlying Token Address" 
            variant='outlined'
            name="underlyingTokenAddress"
            value={inputs.underlyingTokenAddress}
            onChange={handleInputChange}
            />
          
          {/* <br/> */}

          <TextField 
            fullWidth
            label="Underlying Token ID" 
            variant='outlined'
            name="underlyingTokenID"
            value={inputs.underlyingTokenID}
            onChange={handleInputChange}
            />
        </Stack>

        <br/>

        <Button fullWidth variant="outlined" color="success" onClick={create}>
          Create Auction
        </Button>
      </FormControl>
    </Container>

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

