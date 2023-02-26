import { FormControl, MenuItem, Container, TextField, useTheme, Button, Stack } from '@mui/material';
import React, { Reducer } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite, useSigner, useNetwork } from 'wagmi'
import FlowRateInput from '../components/FlowRateInput';
import { ChainId, constants, ControllerName, getControllerByName, waitForTxPromise } from '../helpers';
import { ContractTransaction, ethers } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils.js';
import { useNavigate } from 'react-router-dom';
import DurationInput from '../components/DurationInput';
import { ContinuousRentalAuctionFactory, ContinuousRentalAuctionFactory__factory, EnglishRentalAuctionFactory, EnglishRentalAuctionFactory__factory } from '../types';
import { MyContext, TransactionAlertStatus } from '../App';

function reducer(state: Inputs, update: InputsUpdate) {
  return { ...state, [update.name]: update.value };
}

type Inputs = {
  auctionType: string,
  acceptedToken: string,
  reserveRate: string,
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
  const {chain} = useNetwork();
  const chainId = chain!.id as ChainId;

  const navigate = useNavigate();
  
  const { setTransactionAlertStatus } = React.useContext(MyContext);

  const theme = useTheme();
  const cardStyle = {
    padding: theme.spacing(2)
  };

  const [inputs, updateInputs] = React.useReducer<Reducer<Inputs, InputsUpdate>>(reducer, {
    auctionType: 'continuous',
    acceptedToken: '',
    reserveRate: '0',
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

  const [continuousFactoryAddress, setContinuousFactoryAddress] = React.useState<string>();
  const [englishFactoryAddress, setEnglishFactoryAddress] = React.useState<string>();

  React.useEffect(() => {
    if (address) {
      updateInputs({ name: 'beneficiary', value: address });
    }
  }, [address]);

  React.useEffect(() => {
    setContinuousFactoryAddress(constants.factories[chainId].continuousRentalAuctionFactory);
    setEnglishFactoryAddress(constants.factories[chainId].englishRentalAuctionFactory);
  }, [chainId])


  function handleInputChange(event: any) {
    const { name, value } = event.target;
    updateInputs({ name, value });
  }

  async function createContinuous(): Promise<string> {
    if (!signer || !continuousFactoryAddress) throw new Error('No signer or factory address');

    const factoryContract = ContinuousRentalAuctionFactory__factory.connect(continuousFactoryAddress, signer);
  
    const deployTxPromise = factoryContract.create(
      inputs.acceptedToken,
      getControllerByName(inputs.controllerObserverImplementation as ControllerName).implementation,
      ethers.BigNumber.from(Math.floor(Number(inputs.minimumBidFactor) * 1e18) + ''),
      ethers.BigNumber.from(Math.floor(Number(inputs.reserveRate) * 1e18) + ''),
      new AbiCoder().encode(['address', 'uint256'], [ethers.utils.getAddress(inputs.underlyingTokenAddress), inputs.underlyingTokenID])
    );

    const receipt = await waitForTxPromise(deployTxPromise, setTransactionAlertStatus);

    const deployEvent = receipt.events?.find(e => e.event === 'ContinuousRentalAuctionDeployed');

    if (!deployEvent) {
      throw new Error('No deploy event found');
    }

    const auctionAddress = deployEvent.args?.auctionAddress;

    if (!auctionAddress) {
      throw new Error('No auction address found');
    }
    
    return auctionAddress;
  }

  async function createEnglish(): Promise<string> {
    if (!signer || !englishFactoryAddress) throw new Error('No signer or factory address');
    const factoryContract = EnglishRentalAuctionFactory__factory.connect(englishFactoryAddress, signer);

    const deployTxPromise = factoryContract.create({
      acceptedToken: inputs.acceptedToken,
      controllerObserverImplementation: getControllerByName(inputs.controllerObserverImplementation as ControllerName).implementation,
      minimumBidFactorWad: ethers.BigNumber.from(Math.floor(Number(inputs.minimumBidFactor) * 1e18) + ''),
      reserveRate: ethers.BigNumber.from(Math.floor(Number(inputs.reserveRate) * 1e18) + ''),
      minRentalDuration: ethers.BigNumber.from(Math.floor(Number(inputs.minRentalDuration)) + ''),
      maxRentalDuration: ethers.BigNumber.from(Math.floor(Number(inputs.maxRentalDuration)) + ''),
      biddingPhaseDuration: ethers.BigNumber.from(Math.floor(Number(inputs.biddingPhaseDuration)) + ''),
      biddingPhaseExtensionDuration: ethers.BigNumber.from(Math.floor(Number(inputs.biddingPhaseExtensionDuration)) + ''),
      controllerObserverExtraArgs: new AbiCoder().encode(['address', 'uint256'], [ethers.utils.getAddress(inputs.underlyingTokenAddress), inputs.underlyingTokenID])
    });

    const receipt = await waitForTxPromise(deployTxPromise, setTransactionAlertStatus);

    const deployEvent = receipt.events?.find(e => e.event === 'EnglishRentalAuctionDeployed');

    if (!deployEvent) {
      throw new Error('No deploy event found');
    }

    const auctionAddress = deployEvent.args?.auctionAddress;
    if (!auctionAddress) {
      throw new Error('No auction address found');
    }

    return auctionAddress;
  }

  async function create() {
    let auctionAddress;
    try {
      if (inputs.auctionType === 'continuous') {
        auctionAddress = await createContinuous();
      } else {
        auctionAddress = await createEnglish();
      }
    }
    catch (e) {
      setTransactionAlertStatus(TransactionAlertStatus.Fail);
      throw e;
    }

    navigate(`/manage-auction/${chainId}/${auctionAddress}`);
  }

  // if (inputs.controllerObserverImplementation === 'Lens Protocol') {
  //   inputs.underlyingTokenAddress = constants.lensHubAddresses.polygonMumbai; // todo multichain
  // }

  return (
    <Container>
      <h1>Create Auction</h1>

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
          {constants.superTokens[chainId].map((token, i) => (
            <MenuItem key={i} value={token.address}>{token.symbol}</MenuItem>
          ))}
        </TextField> <br/>

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
          {
            constants.controllerTypes.map((c, i) => (
              <MenuItem key={i} value={c.name}>
                {c.name}
              </MenuItem>
            ))
          }
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

