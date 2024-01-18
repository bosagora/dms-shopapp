import {
  Keyboard,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { trunk, useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { getSecureValue, saveSecureValue } from '../../utils/secure.store';
import ImportPrivateKey from '../../components/ImportPrivateKey';
import {
  Box,
  ButtonText,
  Button,
  Center,
  Text,
  VStack,
  Spinner,
  HStack,
} from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader';
import { Wallet } from 'ethers';
import * as Device from 'expo-device';
import { getClient } from '../../utils/client';

const Secret = observer(({ navigation }) => {
  const { pinStore, userStore, secretStore } = useStores();
  const [client, setClient] = useState();
  const [address, setAddress] = useState('');

  const fetchClient = async () => {
    const { client: client1, address: userAddress } = await getClient();
    console.log('>>>>>>> userAddress :', userAddress);
    setClient(client1);
    setAddress(userAddress);

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
    console.log('------>>>>>');
    setTimeout(async () => {
      await createWallet();
    }, 100);
  }

  async function registerPushTokenWithClient(cc) {
    console.log('registerPushTokenWithClient >>>>>>>> cc:', cc);
    const token = userStore.expoPushToken;
    console.log('token :', token);
    const language = 'kr';
    const os = Platform.OS === 'android' ? 'android' : 'iOS';
    try {
      await cc.ledger.registerMobileToken(token, language, os);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      alert('푸시 토큰 등록에 실패하였습니다.' + JSON.stringify(e));
    }
  }
  function resetPinCode() {
    userStore.setLoading(false);
    console.log('registerPushToken >>');
    alert('새로운 지갑이 생성 되었습니다.');
    navigation.navigate('InitPinCodeScreen');
  }

  async function saveKey(key) {
    key = key.trim();
    console.log('key :', key);
    console.log('key.split :', key.split('0x'));
    // const privateKey = key.includes('0x') ? key.split('0x')[1] : key;
    // console.log('save privateKey :', privateKey);
    let wallet;
    try {
      wallet = new Wallet(key);
    } catch (e) {
      console.log('Invalid private key.');
      alert('유효하지 않은 키 입니다.');
      return;
    }
    secretStore.setAddress(wallet.address);
    await saveSecureValue('address', wallet.address);
    await saveSecureValue('privateKey', key);
    const cc = await fetchClient();
    if (Device.isDevice) {
      await registerPushTokenWithClient(cc);
      resetPinCode();
    } else {
      console.log('Not on device.');
      resetPinCode();
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
          title='지갑 생성'
          subTitle='상점 등록 및 정산을 위한 지갑'
        />
        <VStack space='lg' pt='$4' m='$7'>
          <Box>
            <Button py='$2.5' px='$3' onPress={tt}>
              <ButtonText>지갑 생성하기</ButtonText>
            </Button>
          </Box>
          <ImportPrivateKey saveKey={saveKey} />
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default Secret;
