import { ethers } from "ethers";
import { ExecutionResult } from "graphql";
import base64Lens from "../assets/lensProfile";
import { BlockNumberDocument, BlockNumberQuery, ERC721ControllerObserver, ERC721ControllerObserversByOwnerQuery, execute, RentalAuctionsQuery } from "../graph/.graphclient";


const lensControllerImpl = "0xDBD4f875638fa3E8889D3d431E4bef464c27D7A3".toLowerCase();
const erc4907ControllerImpl = "0x786f9d6Cd7B63b7d69fB716E3b16eb9e54E6AE4D".toLowerCase();
const auctionTypesReadable: {[key: string]: string} = {
    "continuous": "Continuous Rental Auction",
    "english": "English Rental Auction"
}

// export const enum Network {
//     polygonMumbai = 'polygonMumbai'
// }
type Network = "polygonMumbai";

export const constants = {
    lensControllerImpl: lensControllerImpl,
    erc4907ControllerImpl: erc4907ControllerImpl,
    continuousRentalAuctionFactory: '0x862E55E8ab6CD3cf914Cd889e22C142BD7faD15f',
    officialControllerImpls: [lensControllerImpl, erc4907ControllerImpl],
    zeroAddress: "0x0000000000000000000000000000000000000000",
    graphPollingInterval: 2000,
    abis: {
        ContinuousRentalAuctionFactory: require("../abi/ContinuousRentalAuctionFactory.json").abi,
        IERC721Metadata: require("../abi/IERC721Metadata.json").abi,
        ContinuousRentalAuction: require("../abi/ContinuousRentalAuction.json").abi,
        ERC721ControllerObserver: require("../abi/ERC721ControllerObserver.json").abi,
    },
    superTokens: {
        polygonMumbai: [
            {
                address: "0x96B82B65ACF7072eFEb00502F45757F254c2a0D4".toLowerCase(),
                symbol: "MATICx",
            },
            {
                address: "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f".toLowerCase(),
                symbol: "DAIx",
            },
            {
                address: "0x918E0d5C96cAC79674E2D38066651212be3C9C48".toLowerCase(),
                symbol: "TUSDx",
            },
            {
                address: "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7".toLowerCase(),
                symbol: "USDCx",
            },
        ],
    },
    auctionTypesReadable
};

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

export function getSymbolOfSuperToken(network: Network, address: string): string {
    for (let i = 0; i < constants.superTokens[network].length; i++) {
        if (constants.superTokens[network][i].address === address.toLowerCase()) {
            return constants.superTokens[network][i].symbol;
        }
    }

    return "";
}

export function getSuperTokenAddressFromSymbol(network: Network, symbol: string) {
    // todo multichain
    for (let i = 0; i < constants.superTokens[network].length; i++) {
      if (constants.superTokens[network][i].symbol === symbol) {
        return constants.superTokens[network][i].address;
      }
    }

    throw new Error("invalid supertoken symbol");
  }

export async function hackLensImage(newHandle: string) {
    const svgText = await fetch(base64Lens).then((x) => x.text());

    const newSvgText = svgText.replace("@universe1927.lens", newHandle);

    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(newSvgText)));
}

export function fixIpfsUri(uri: string): string {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
}

export async function getImageFromAuctionItem(auctionItem: GenericRentalAuctionWithMetadata): Promise<string> {
    if (auctionItem.controllerObserverImplementation.toLowerCase() === constants.lensControllerImpl) {
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

export async function convertControllersQueryToGenericRentalAuctions(query: ERC721ControllerObserversByOwnerQuery): Promise<GenericRentalAuction[]> {
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
        constants.officialControllerImpls.includes(auction.controllerObserverImplementation)
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


export function makeOpenSeaLink(address: string, tokenId: number) {
    // todo other networks
    return `https://testnets.opensea.io/assets/mumbai/${address}/${tokenId}`;
}

export function waitForGraphSync(minBlock: number) {
    return new Promise<void>((resolve, reject) => {
        async function check() {
            const rentalAuctionResult: ExecutionResult<BlockNumberQuery> = await execute(BlockNumberDocument, {});
            if (rentalAuctionResult.data?._meta?.block.number && rentalAuctionResult.data?._meta?.block.number >= minBlock) {
                clearInterval(interval);
                resolve();
            }
        }
        const interval = setInterval(check, constants.graphPollingInterval);
        check();
    });
}
