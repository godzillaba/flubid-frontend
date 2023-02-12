import base64Lens from "../assets/lensProfile";

const lensControllerImpl = "0x11bc64F68fBe2899b581f7DEEf204d49BA445957".toLowerCase();
const erc4907ControllerImpl = "0xbDb5baeb476AeE7904441039e1F712d7DDD88A56".toLowerCase();
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
    officialControllerImpls: [lensControllerImpl, erc4907ControllerImpl],
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

export function getSymbolOfSuperToken(network: Network, address: string): string {
    for (let i = 0; i < constants.superTokens[network].length; i++) {
        if (constants.superTokens[network][i].address === address.toLowerCase()) {
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
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
}

export async function getImageFromAuctionItem(auctionItem: any): Promise<string> {
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

export async function getItemsFromRentalAuctionsDocument(rentalAuctions: any) {
    if (!rentalAuctions) return;

    const auctions = rentalAuctions.filter((auction: any) =>
        constants.officialControllerImpls.includes(auction.controllerObserverImplementation)
    );

    const metadatas = await Promise.all(
        auctions.map((auction: any) => {
            const uri = auction.underlyingTokenURI;
            return fetch(fixIpfsUri(uri))
                .then((res) => res.json())
                .catch(() => {
                    return {};
                });
        })
    );

    return auctions.map((auction: any, index: any) => {
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
