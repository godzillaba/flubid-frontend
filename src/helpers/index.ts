import { ContractTransaction, ethers } from "ethers";
import { ExecutionResult } from "graphql";
import { goerli, polygonMumbai } from "wagmi/chains";
import { TransactionAlertStatus } from "../App";
import base64Lens from "../assets/lensProfile";
import { BlockNumberDocument, BlockNumberQuery, ERC721ControllerObserver, ERC721ControllerObserversByOwnerQuery, execute, getBuiltGraphSDK, RentalAuctionsQuery } from "../graph/.graphclient";

const auctionTypesReadable: {[key: string]: string} = {
    "continuous": "Continuous Rental Auction",
    "english": "English Rental Auction"
}

type Network = "polygonMumbai";

export const constants = {
    // continuousRentalAuctionFactory: '0xaB0d45639Bc816ff79A02B73a81bb6fc1d6678A1',
    // englishRentalAuctionFactory: '0xD3345F3924789Da02645607C9B07f68836292361',
    zeroAddress: "0x0000000000000000000000000000000000000000",
    graphPollingInterval: 2000,
    abis: {
        ContinuousRentalAuctionFactory: require("../abi/ContinuousRentalAuctionFactory.json").abi,
        EnglishRentalAuctionFactory: require("../abi/EnglishRentalAuctionFactory.json").abi,
        IERC721Metadata: require("../abi/IERC721Metadata.json").abi,
        ContinuousRentalAuction: require("../abi/ContinuousRentalAuction.json").abi,
        ERC721ControllerObserver: require("../abi/ERC721ControllerObserver.json").abi,
    },
    superTokens: {
        80001: [ // mumbai
            {
                address: "0x96B82B65ACF7072eFEb00502F45757F254c2a0D4",
                symbol: "MATICx",
            },
            {
                address: "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f",
                symbol: "fDAIx",
            },
            {
                address: "0x918E0d5C96cAC79674E2D38066651212be3C9C48",
                symbol: "fTUSDx",
            },
            {
                address: "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7",
                symbol: "fUSDCx",
            },
        ],
        5: [ // goerli
            {
                address: "0x5943F705aBb6834Cad767e6E4bB258Bc48D9C947",
                symbol: "ETHx",
            },
            {
                address: "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00",
                symbol: "fDAIx",
            },
            {
                address: "0x95697ec24439E3Eb7ba588c7B279b9B369236941",
                symbol: "fTUSDx",
            },
            {
                address: "0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a",
                symbol: "fUSDCx",
            },
        ]
    },
    auctionTypesReadable,
    lensHubAddresses : {
        polygonMumbai: "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
    },
    factories: {
        80001: { // mumbai
            continuousRentalAuctionFactory: '0xaB0d45639Bc816ff79A02B73a81bb6fc1d6678A1',
            englishRentalAuctionFactory: '0xD3345F3924789Da02645607C9B07f68836292361',
        },
        5: { // goerli
            continuousRentalAuctionFactory: '0x041F369897Af6bFFf9d96F056756c11efd512557',
            englishRentalAuctionFactory: '0xdeb68b4Cad98FB5a507a8480fE095D69F0558096',
        }
    },
    controllerTypes: [
        {
            name: "Lens Protocol",
            implementation: "0x0248c352B1295086c3805B2f2eb22833F317f007",
            parameters: [
                { name: "Lens Hub", type: "address" },
                { name: "Lens Profile ID", type: "uint256" },
            ]
        },
        {
            name: "ERC4907 Token",
            implementation: "0xaB9C46b4d0767Cb3733912dB28968317DbB97474",
            parameters: [
                { name: "ERC4907 Address", type: "address" },
                { name: "ERC4907 Token ID", type: "uint256" },
            ]
        }
    ],
    chains: [polygonMumbai, goerli],
    subgraphChainNames: {
        80001: "mumbai",
        5: "goerli",
    },
    transactionAlertTimeout: 5000,
    ipfsGateway: "https://cloudflare-ipfs.com/ipfs/{CID}",
    docsUrl: "https://flubid.gitbook.io/docs/"
} as const;

export type ChainId = typeof constants.chains[number]["id"];

export type ControllerName = typeof constants.controllerTypes[number]["name"];

export function isChainSupported(chainId: number) {
    return constants.chains.some(chain => chain.id === chainId);
}

export function getControllerByName(name: ControllerName) {
    for (let i = 0; i < constants.controllerTypes.length; i++) {
        if (constants.controllerTypes[i].name === name) {
            return constants.controllerTypes[i];
        }
    }

    throw new Error("invalid controller name");
}

export function getControllerByImplementation(impl: string) {
    for (let i = 0; i < constants.controllerTypes.length; i++) {
        if (cmpAddr(constants.controllerTypes[i].implementation, impl)) {
            return constants.controllerTypes[i];
        }
    }

    throw new Error("invalid controller implementation");
}

export function isSupportedControllerImplementation(implementation: string) {
    for (let i = 0; i < constants.controllerTypes.length; i++) {
        if (cmpAddr(constants.controllerTypes[i].implementation, implementation)) {
            return true;
        }
    }
    return false;
}

export function prettyDuration(seconds: number) {
    const secs = seconds % 60;
    const mins = Math.floor(seconds / 60) % 60;
    const hours = Math.floor(seconds / 3600) % 24;
    const days = Math.floor(seconds / 86400);
    const parts = [];
    if (days > 0) {
        parts.push(`${days} day${days > 1 ? "s" : ""}`)
    }
    if (hours > 0) {
        parts.push(`${hours} hour${hours > 1 ? "s" : ""}`)
    }
    if (mins > 0) {
        parts.push(`${mins} minute${mins > 1 ? "s" : ""}`)
    }
    if (secs > 0) {
        parts.push(`${secs} second${secs > 1 ? "s" : ""}`)
    }
    return parts.join(", ");
}

export function formattedDateStringFromSeconds(seconds: number) {
    return formatDate(new Date(seconds * 1000));
}

export function formatDate(d: Date) {
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString(undefined, { hour12: false });
}

export function currentTime() {
    return Math.floor(Date.now() / 1000);
}

export function toFixedScientificNotation(num: number): string {
    if (num === 0) {
        return "0";
    }

    if (!Number.isFinite(num)) {
        return num.toString();
    }

    const absNum = Math.abs(num);
    if (absNum >= 1e-3 && absNum < 1e7) {
        return num % 1 === 0 ? num.toString() : num.toFixed(3);
    }

    const exponent = Math.floor(Math.log10(absNum));
    const mantissa = num / 10 ** exponent;

    return mantissa.toFixed(3) + "e" + exponent;
}

export function cmpAddr(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
}

export function getLogsBySignature(logs: ethers.providers.Log[], signature: string) {
    const topic = ethers.utils.keccak256(signature);
    return getLogsByTopic0(logs, topic);
}

export function getLogsByTopic0(logs: ethers.providers.Log[], topic0: string) {
    return logs.filter(log => log.topics[0] === topic0);
}

export function getSymbolOfSuperToken(network: ChainId, address: string): string {
    for (let i = 0; i < constants.superTokens[network].length; i++) {
        if (cmpAddr(constants.superTokens[network][i].address, address.toLowerCase())) {
            return constants.superTokens[network][i].symbol;
        }
    }

    return "";
}


export async function hackLensImage(newHandle: string) {
    const svgText = await fetch(base64Lens).then((x) => x.text());

    const newSvgText = svgText.replace("@universe1927.lens", newHandle);

    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(newSvgText)));
}

export function fixIpfsUri(uri: string): string {
    if (!uri.startsWith("ipfs://")) {
        return uri;
    }
    const cid = uri.replace("ipfs://", "");
    return constants.ipfsGateway.replace("{CID}", cid);
}

export async function getImageFromAuctionItem(auctionItem: GenericRentalAuctionWithMetadata): Promise<string> {
    if (cmpAddr(auctionItem.controllerObserverImplementation, getControllerByName("Lens Protocol").implementation)) {
        // HACK
        // use template lens image and replace handle. for some reason profile images returned from lensHub look weird
        return hackLensImage(auctionItem.metadata.name);
    } else {
        if (typeof auctionItem.metadata.image === "string") {
            return auctionItem.metadata.image;
        } else {
            return auctionItem.metadata.properties.image.description;
        }
    }
}

export type GenericRentalAuction = RentalAuctionsQuery["genericRentalAuctions"][0];

export type GenericRentalAuctionWithMetadata = GenericRentalAuction & {metadata: {[key: string]: any}}

export function convertControllersQueryToGenericRentalAuctions(query: ERC721ControllerObserversByOwnerQuery): GenericRentalAuction[] {
    const auctions: GenericRentalAuction[] = [];

    const data = query.erc721ControllerObservers;

    for (let i = 0; i < data.length; i++) {
        const deepCopy = JSON.parse(JSON.stringify(data[i])) as ERC721ControllerObserversByOwnerQuery["erc721ControllerObservers"][0];
        const {genericRentalAuction: rentalAuctionMinusController, ...controllerMinusRentalAuction} = deepCopy;

        auctions.push({
            ...rentalAuctionMinusController,
            controllerObserver: controllerMinusRentalAuction,
        });
    }

    return auctions;
}

export async function addMetadataToGenericRentalAuctions(rentalAuctions: GenericRentalAuction[]): Promise<GenericRentalAuctionWithMetadata[]> {
    // if (!queryResult) return null;

    // const rentalAuctions = queryResult.genericRentalAuctions;

    const auctions = rentalAuctions.filter((auction: any) =>
        isSupportedControllerImplementation(auction.controllerObserverImplementation)
    );

    const metadatas: {[key: string]: string}[] = await Promise.all(
        auctions.map(async auction => {
            const uri = auction.controllerObserver.underlyingTokenURI;
            try {
                const res = await fetch(fixIpfsUri(uri));
                return (await res.json()) as {[key: string]: string};
            } catch {
                return {};
            }
        })
    );

    return auctions.map((auction, index) => {
        return {
            ...auction,
            metadata: metadatas[index],
        };
    });
}


export function makeOpenSeaLink(address: string, tokenId: number, chainId: ChainId) {
    let base = "https://opensea.io/assets/";
    if ([5, 80001].includes(chainId)) {
        base = "https://testnets.opensea.io/assets/";
    }
    return base + address + "/" + tokenId;
}

export function waitForGraphSync(minBlock: number, chainId: ChainId) {
    return new Promise<void>((resolve, reject) => {
        const graphSdk = getGraphSDK(chainId);
        async function check() {
            const result = await graphSdk.BlockNumber();
            if (result._meta?.block.number && result._meta?.block.number >= minBlock) {
                clearInterval(interval);
                resolve();
            }
        }
        const interval = setInterval(check, constants.graphPollingInterval);
        check();
    });
}

export async function waitForTxPromise(txPromise: Promise<ContractTransaction>, setTransactionAlertStatus: (status: TransactionAlertStatus) => void, waitForGraph: boolean = true) {
    try {
        setTransactionAlertStatus(TransactionAlertStatus.Pending);
        const tx = await txPromise;
        const receipt = await tx.wait();
        if (waitForGraph) await waitForGraphSync(receipt.blockNumber, tx.chainId as ChainId);
        setTransactionAlertStatus(TransactionAlertStatus.Success);
        return receipt;
    }
    catch (e) {
        setTransactionAlertStatus(TransactionAlertStatus.Fail);
        throw e;
    }
}

export function getGraphSDK(chainId: ChainId) {
    return getBuiltGraphSDK({
        chainName: constants.subgraphChainNames[chainId]
    });
}
