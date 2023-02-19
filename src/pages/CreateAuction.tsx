import { FormControl, MenuItem, Container, TextField, useTheme, Button, Stack } from '@mui/material';
import React, { Reducer } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite, useSigner } from 'wagmi'
import FlowRateInput from '../components/FlowRateInput';
import { constants, getLogsBySignature, getSuperTokenAddressFromSymbol, waitForGraphSync } from '../helpers';
import { ContractTransaction, ethers } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils.js';
import { useNavigate } from 'react-router-dom';
import DurationInput from '../components/DurationInput';
import { ContinuousRentalAuctionFactory__factory, EnglishRentalAuctionFactory, EnglishRentalAuctionFactory__factory } from '../types/ethers-contracts';

function reducer(state: Inputs, update: InputsUpdate) {
  return { ...state, [update.name]: update.value };
}

type Inputs = {
  auctionType: string,
  acceptedToken: string, // todo multichain
  reserveRate: string,
  beneficiary: string,
  minimumBidFactor: string,

  // english specific inputs
  minRentalDuration: string,
  maxRentalDuration: string,
  biddingPhaseDuration: string,
  biddingPhaseExtensionDuration: string,

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
  const navigate = useNavigate();
  

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

    // english specific inputs
    minRentalDuration: '',
    maxRentalDuration: '',
    biddingPhaseDuration: '',
    biddingPhaseExtensionDuration: '',

    controllerObserverImplementation: '',
    underlyingTokenAddress: '',
    underlyingTokenID: ''
  });

  React.useEffect(() => {
    if (address) {
      updateInputs({ name: 'beneficiary', value: address });
    }
  }, [address]);


  function handleInputChange(event: any) {
    const { name, value } = event.target;
    updateInputs({ name, value });
  }

  async function createContinuous(): Promise<string> {
    if (!signer) return '';
    // const factoryContract = new ethers.Contract(constants.continuousRentalAuctionFactory, constants.abis.ContinuousRentalAuctionFactory, signer);
    const factoryContract = ContinuousRentalAuctionFactory__factory.connect(constants.continuousRentalAuctionFactory, signer);
  
    const deployTx = await factoryContract.create(
      getSuperTokenAddressFromSymbol('polygonMumbai', inputs.acceptedToken),
      inputs.controllerObserverImplementation === 'ERC4907ControllerObserver' ? constants.erc4907ControllerImpl : constants.lensControllerImpl,
      inputs.beneficiary,
      ethers.BigNumber.from(Math.floor(Number(inputs.minimumBidFactor) * 1e18) + ''),
      ethers.BigNumber.from(Math.floor(Number(inputs.reserveRate) * 1e18) + ''),
      new AbiCoder().encode(['address', 'uint256'], [ethers.utils.getAddress(inputs.underlyingTokenAddress), inputs.underlyingTokenID])
    );
    const receipt = await deployTx.wait();

    const deployEvent = receipt.events?.find(e => e.event === 'ContinuousRentalAuctionDeployed');

    if (!deployEvent) {
      throw new Error('No deploy event found');
    }

    const auctionAddress = deployEvent.args?.auctionAddress;

    if (!auctionAddress) {
      throw new Error('No auction address found');
    }
    
    await waitForGraphSync(receipt.blockNumber);

    return auctionAddress;
  }

  async function createEnglish(): Promise<string> {
    if (!signer) return '';
    const factoryContract = EnglishRentalAuctionFactory__factory.connect(constants.englishRentalAuctionFactory, signer);

    const deployTx = await factoryContract.create({
      acceptedToken: getSuperTokenAddressFromSymbol('polygonMumbai', inputs.acceptedToken),
      controllerObserverImplementation: inputs.controllerObserverImplementation === 'ERC4907ControllerObserver' ? constants.erc4907ControllerImpl : constants.lensControllerImpl,
      beneficiary: inputs.beneficiary,
      minimumBidFactorWad: ethers.BigNumber.from(Math.floor(Number(inputs.minimumBidFactor) * 1e18) + ''),
      reserveRate: ethers.BigNumber.from(Math.floor(Number(inputs.reserveRate) * 1e18) + ''),
      minRentalDuration: ethers.BigNumber.from(Math.floor(Number(inputs.minRentalDuration)) + ''),
      maxRentalDuration: ethers.BigNumber.from(Math.floor(Number(inputs.maxRentalDuration)) + ''),
      biddingPhaseDuration: ethers.BigNumber.from(Math.floor(Number(inputs.biddingPhaseDuration)) + ''),
      biddingPhaseExtensionDuration: ethers.BigNumber.from(Math.floor(Number(inputs.biddingPhaseExtensionDuration)) + ''),
      controllerObserverExtraArgs: new AbiCoder().encode(['address', 'uint256'], [ethers.utils.getAddress(inputs.underlyingTokenAddress), inputs.underlyingTokenID])
    });

    const receipt = await deployTx.wait();
    const deployEvent = receipt.events?.find(e => e.event === 'EnglishRentalAuctionDeployed');

    if (!deployEvent) {
      throw new Error('No deploy event found');
    }

    const auctionAddress = deployEvent.args?.auctionAddress;
    if (!auctionAddress) {
      throw new Error('No auction address found');
    }
    await waitForGraphSync(receipt.blockNumber);
    return auctionAddress;
  }

  async function create() {
    let auctionAddress;
    if (inputs.auctionType === 'continuous') {
      auctionAddress = await createContinuous();
    } else {
      auctionAddress = await createEnglish();
    }
    
    navigate(`/manage-auction/${auctionAddress}`);
  }

  if (inputs.controllerObserverImplementation === 'LensControllerObserver') {
    inputs.underlyingTokenAddress = constants.lensHubAddresses.polygonMumbai; // todo multichain
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

        {/* english specific options */}
        {/* minRentalDuration, maxRentalDuration, biddingPhaseDuration, biddingPhaseExtensionDuration */}
        {inputs.auctionType === 'english' ? (
          <>
            <br/>
            <Stack direction="row" spacing={2}>
            <DurationInput label="Minimum Rental Duration" onChange={value => updateInputs({ name: "minRentalDuration", value: value.toString() })}/>
            <DurationInput label="Maximum Rental Duration" onChange={value => updateInputs({ name: "maxRentalDuration", value: value.toString() })}/>

            </Stack>
            <br/>
            <Stack direction="row" spacing={2}>
              <DurationInput label="Bidding Phase Duration" onChange={value => updateInputs({ name: "biddingPhaseDuration", value: value.toString() })}/>
              <DurationInput label="Bidding Phase Extension Duration" onChange={value => updateInputs({ name: "biddingPhaseExtensionDuration", value: value.toString() })}/>
            </Stack>
          </>
        ) : null}

        
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
  );
}

