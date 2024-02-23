import { Platform, SafeAreaView } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { saveSecureValue } from '../../utils/secure.store';
import ImportPrivateKey from '../../components/ImportPrivateKey';
import { Box, ButtonText, Button, VStack } from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader';
import { Wallet } from 'ethers';
import * as Device from 'expo-device';
import { getClient } from '../../utils/client';
import { AUTH_STATE } from '../../stores/user.store';
import { MobileType } from 'dms-sdk-client';
import { useTranslation } from 'react-i18next';

const Secret = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { userStore, secretStore } = useStores();
  const [client, setClient] = useState();
  const [walletAddress, setWalletAddress] = useState('');
  const [fromOtherWallet, setFromOtherWallet] = useState(false);

  const fetchClient = async () => {
    const { client: client1, address: userAddress } = await getClient();
    console.log('>>>>>>> userAddress :', userAddress);
    setClient(client1);
    setWalletAddress(userAddress);

    console.log('Secret fetch > client1 :', client1);
    return client1;
  };

  async function createWallet() {
    const wallet = Wallet.createRandom();

    console.log('address :', wallet.address);
    console.log('mnemonic :', wallet.mnemonic);
    console.log('privateKey :', wallet.privateKey);

    secretStore.setAddress(wallet.address);
    await saveSecureValue('address', wallet.address);
    await saveSecureValue('mnemonic', JSON.stringify(wallet.mnemonic));
    await saveSecureValue('privateKey', wallet.privateKey);
    // setIsLoading(false);

    const cc = await fetchClient();
    if (Device.isDevice) {
      await registerPushTokenWithClient(cc);
      resetPinCode();
    } else {
      console.log('Not on device.');
      resetPinCode();
    }
  }

  async function tt() {
    userStore.setLoading(true);
    setTimeout(async () => {
      await createWallet();
    }, 100);
  }

  async function registerPushTokenWithClient(cc) {
    console.log('registerPushTokenWithClient >>>>>>>> cc:', cc);
    if (
      userStore.expoPushToken === '' ||
      userStore.enableNotification === false
    ) {
      userStore.setRegisteredPushToken(false);
      return;
    }

    const token = userStore.expoPushToken;
    const language = 'kr';
    const os = Platform.OS === 'android' ? 'android' : 'iOS';
    try {
      await cc.ledger.registerMobileToken(
        token,
        language,
        os,
        MobileType.SHOP_APP,
      );
      userStore.setRegisteredPushToken(true);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      alert(t('secret.alert.push.fail') + JSON.stringify(e.message));
    }
  }
  function resetPinCode(uri = 'ShopReg') {
    userStore.setLoading(false);
    alert(t('secret.alert.wallet.done'));
    navigation.navigate(uri);
  }

  async function saveKey(key) {
    key = key.trim();
    let wallet;
    try {
      wallet = new Wallet(key);
    } catch (e) {
      alert(t('secret.alert.wallet.invalid'));
      return;
    }
    secretStore.setAddress(wallet.address);
    await saveSecureValue('address', wallet.address);
    await saveSecureValue('privateKey', key);

    await fetchClient();
    userStore.setLoading(false);
    setFromOtherWallet(true);
  }

  async function afterSelectingShop() {
    if (Device.isDevice) {
      await registerPushTokenWithClient(client);
      userStore.setAuthState(AUTH_STATE.DONE);
    } else {
      console.log('Not on device.');
      userStore.setAuthState(AUTH_STATE.DONE);
    }
  }

  return (
    <SafeAreaView>
      <Box
        sx={{
          _dark: { bg: '$backgroundDark800' },
          _web: {
            height: '100vh',
            w: '100vw',
            overflow: 'hidden',
          },
        }}
        height='$full'
        bg='$backgroundLight0'>
        <MobileHeader
          title={t('secret.header.title')}
          subTitle={t('secret.header.subtitle')}
        />
        <VStack space='lg' pt='$4' m='$7'>
          <Box>
            <Button py='$2.5' px='$3' onPress={tt}>
              <ButtonText>{t('wallet.create')}</ButtonText>
            </Button>
          </Box>
          <ImportPrivateKey
            saveKey={saveKey}
            fromOtherWallet={fromOtherWallet}
            afterSelectingShop={afterSelectingShop}
            client={client}
          />
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default Secret;
