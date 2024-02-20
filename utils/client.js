import { getSecureValue } from './secure.store';
import { Client, Context, LIVE_CONTRACTS } from 'dms-sdk-client';
import '@ethersproject/shims';
import { Wallet } from 'ethers';

export async function getClient() {
  const DMS_SDK_LINK = {
    development: 'bosagora_devnet',
    preview: 'bosagora_devnet',
    product: 'bosagora_mainnet',
  };

  const Networks = {
    development: 24680,
    preview: 24680,
    product: 24680,
  };
  const web3EndpointsMainnet = {
    working: ['https://mainnet.bosagora.org/'],
    failing: ['https://bad-url-gateway.io/'],
  };

  const web3EndpointsDevnet = {
    working: ['http://rpc.devnet.bosagora.org:8545/'],
    failing: ['https://bad-url-gateway.io/'],
  };
  const Web3EndPoint = {
    development: web3EndpointsDevnet,
    preview: web3EndpointsDevnet,
    product: web3EndpointsMainnet,
  };
  const grapqhlEndpointsMainnet = {
    working: [
      {
        url: 'http://subgraph.devnet.bosagora.org:8000/subgraphs/name/bosagora/dms-osx-devnet',
      },
    ],
    timeout: [
      {
        url: 'https://httpstat.us/504?sleep=100',
      },
      {
        url: 'https://httpstat.us/504?sleep=200',
      },
      {
        url: 'https://httpstat.us/504?sleep=300',
      },
    ],
    failing: [{ url: 'https://bad-url-gateway.io/' }],
  };

  const grapqhlEndpointsDevnet = {
    working: [
      {
        url: 'http://subgraph.devnet.bosagora.org:8000/subgraphs/name/bosagora/dms-osx-devnet',
      },
    ],
    timeout: [
      {
        url: 'https://httpstat.us/504?sleep=100',
      },
      {
        url: 'https://httpstat.us/504?sleep=200',
      },
      {
        url: 'https://httpstat.us/504?sleep=300',
      },
    ],
    failing: [{ url: 'https://bad-url-gateway.io/' }],
  };

  const GraphqlEndPoint = {
    development: grapqhlEndpointsDevnet,
    preview: grapqhlEndpointsDevnet,
    product: grapqhlEndpointsMainnet,
  };

  const relayEndpointsMainnet = {
    working: 'http://relay.devnet.bosagora.org:7070/',
    failing: 'https://bad-url-gateway.io/',
  };

  const relayEndpointsDevnet = {
    working: 'http://relay.devnet.bosagora.org:7070/',
    failing: 'https://bad-url-gateway.io/',
  };

  const RelayEndPoint = {
    development: relayEndpointsDevnet,
    preview: relayEndpointsDevnet,
    product: relayEndpointsMainnet,
  };

  const sdkLink =
    DMS_SDK_LINK[process.env.EXPO_PUBLIC_ENV || process.env.ENVIRONMENT];

  const relayEndPoint =
    RelayEndPoint[process.env.EXPO_PUBLIC_ENV || process.env.ENVIRONMENT];

  const web3EndPoint =
    Web3EndPoint[process.env.EXPO_PUBLIC_ENV || process.env.ENVIRONMENT];

  const graphqlEndPoint =
    GraphqlEndPoint[process.env.EXPO_PUBLIC_ENV || process.env.ENVIRONMENT];

  const network =
    Networks[process.env.EXPO_PUBLIC_ENV || process.env.ENVIRONMENT];

  async function fetchKey() {
    console.log('getClient > fetchKey');
    let pKey = await getSecureValue('privateKey');
    if (pKey.includes('0x')) {
      // pKey = pKey.split('0x')[1];
      console.log('pKey :', pKey);
    }
    const address = await getSecureValue('address');

    return { pKey, address };
  }
  const { pKey, address } = await fetchKey();
  function createClient(privateKey) {
    const ctx = new Context({
      network: network,
      signer: new Wallet(privateKey),
      web3Providers: web3EndPoint.working,
      relayEndpoint: relayEndPoint.working,
      graphqlNodes: graphqlEndPoint.working,
      ledgerAddress: LIVE_CONTRACTS[sdkLink].LedgerAddress,
      tokenAddress: LIVE_CONTRACTS[sdkLink].LoyaltyTokenAddress,
      phoneLinkAddress: LIVE_CONTRACTS[sdkLink].PhoneLinkCollectionAddress,
      validatorAddress: LIVE_CONTRACTS[sdkLink].ValidatorAddress,
      currencyRateAddress: LIVE_CONTRACTS[sdkLink].CurrencyRateAddress,
      shopAddress: LIVE_CONTRACTS[sdkLink].ShopAddress,
      loyaltyProviderAddress: LIVE_CONTRACTS[sdkLink].LoyaltyProviderAddress,
      loyaltyConsumerAddress: LIVE_CONTRACTS[sdkLink].LoyaltyConsumerAddress,
      loyaltyExchangerAddress: LIVE_CONTRACTS[sdkLink].LoyaltyExchangerAddress,
    });
    return new Client(ctx);
  }
  const client = createClient(pKey);
  console.log('client :', client);
  console.log('>> address :', address);
  return { client, address };
}
