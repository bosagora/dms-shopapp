import React, { useState } from 'react';
import {
  AddIcon,
  Box,
  Button,
  ButtonIcon,
  VStack,
  Heading,
  Text,
  ButtonText,
} from '@gluestack-ui/themed';
import BiometricAuthScreen from './BiometricAuthScreen';
import HandelAuthentication from './HandelAuthentication';
import ModalScreen from './ModalScreen';
import { PinCodeT } from 'react-native-pincode-bosagora-ys';
import { useStores } from '../../stores';
import { AUTH_STATE } from '../../stores/user.store';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import QRActionSheet from './QRActionSheet';
import LocalNotification from './LocalNotification';
import MileageRedeemNotification from '../wallet/MileageRedeemNotification';
import { saveSecureValue } from '../../utils/secure.store';

// export default function Kitchen({ navigation }) {
const Kitchen = observer(({ navigation }) => {
  const { pinStore, userStore, loyaltyStore, secretStore } = useStores();
  async function initAuth() {
    console.log('initAuth');
    clearInterval(userStore.walletInterval);
    userStore.reset();
    pinStore.reset();
    loyaltyStore.reset();
    secretStore.reset();
    await saveSecureValue('address', '');
    await saveSecureValue('mnemonic', '');
    await saveSecureValue('privateKey', '');
    userStore.setAuthState(AUTH_STATE.INIT);
  }

  function goToAuthScreen(nextScreen) {
    console.log('goToAuthScreen');
    pinStore.setMode('enter');
    pinStore.setSuccessEnter(false);
    pinStore.setNextScreen(nextScreen);
    pinStore.setVisible(true);
  }
  //
  // autorun(() => {
  //   if (!pinStore.needPinCode) {
  //     if (pinStore.successEnter) navigation.navigate(pinStore.nextScreen);
  //   }
  // });

  return (
    <Box flex={1} justifyContent='center' bg='$primary950'>
      <VStack p='$12' reversed={false}>
        <Box space='md'>
          <Button my='$2' onPress={() => navigation.navigate('Temp')}>
            <ButtonText>Go to Temp </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            onPress={() => {
              const payment = {
                id: '0x8a1e2380b3b0a6f59a75986de9f0ac3f0220be5718cd0622cc7c54ef8d8a13c6',
                type: 'new',
              };
              loyaltyStore.setPayment(payment);
              navigation.navigate('MileageRedeemNotification');
            }}>
            <ButtonText>Go to MileageRedeemNotification </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            onPress={() => navigation.navigate('LocalNotification')}>
            <ButtonText>Go to SendNotification </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button my='$2' onPress={() => navigation.navigate('QRActionSheet')}>
            <ButtonText>Go to QRActionSheet</ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button my='$2' onPress={() => navigation.navigate('Detail')}>
            <ButtonText>Go to Detail </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>

          <Button my='$2' onPress={() => goToAuthScreen('About')}>
            <ButtonText>Go to PinCode </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            size='md'
            variant='solid'
            action='primary'
            isDisabled={false}
            isFocusVisible={false}
            onPress={() => navigation.navigate('SignIn')}>
            <ButtonText>Go to SignIn </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            size='md'
            variant='solid'
            action='primary'
            isDisabled={false}
            isFocusVisible={false}
            onPress={() => navigation.navigate('BiometricAuthScreen')}>
            <ButtonText>Go to Biometric AuthScreen </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            size='md'
            variant='solid'
            action='primary'
            isDisabled={false}
            isFocusVisible={false}
            onPress={() => navigation.navigate('HandelAuthentication')}>
            <ButtonText>Go to Handle Authentication </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
          <Button
            my='$2'
            size='md'
            variant='solid'
            action='primary'
            isDisabled={false}
            isFocusVisible={false}
            onPress={() => navigation.navigate('ModalScreen')}>
            <ButtonText>Go to ModalScreen </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>

          <Button
            my='$2'
            size='md'
            variant='solid'
            action='primary'
            isDisabled={false}
            isFocusVisible={false}
            onPress={() => initAuth()}>
            <ButtonText>Reset Init State </ButtonText>
            <ButtonIcon as={AddIcon} />
          </Button>
        </Box>
      </VStack>
    </Box>
  );
});

export default Kitchen;
