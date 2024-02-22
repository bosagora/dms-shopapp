import React, { useEffect, useState } from 'react';
import { PinCode, PinCodeT } from 'react-native-pincode-bosagora-ys';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, StyleSheet, View } from 'react-native';
import { useStores } from '../stores';
import { observer } from 'mobx-react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from 'expo-router';
import * as RootNavigation from '../utils/root.navigation';
import { useTranslation } from 'react-i18next';

const PinCodeScreen = observer(() => {
  const { t } = useTranslation();
  const { pinStore, userStore } = useStores();

  const customTexts = {
    enter: {
      subTitle: t('pin.enter.subTitle'),
    },
    set: {
      title: t('pin.set.title'),
      subTitle: '{{pinLength}} ' + t('pin.set.subTitle'),
      repeat: t('pin.set.repeat'),
    },
    locked: {
      title: t('pin.locked.title'),
      subTitle: `Wrong PIN {{maxAttempt}} times.\nTemporarily locked in {{lockDuration}}.`,
    },
  };

  const EnterAndSet = {
    header: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: 100,
    },
    title: { fontSize: 24 },
    pin: { backgroundColor: '#a78bfa' },
  };

  const customStyles = {
    main: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99,
      backgroundColor: '#4b5563',
    },
    enter: {
      ...EnterAndSet,
      buttonTextDisabled: { color: 'gray' },
    },
    set: EnterAndSet,
    locked: {
      countdown: { borderColor: 'black' },
      countdownText: { color: 'black' },
    },
    reset: {
      confirmText: { color: 'red' },
    },
  };

  useEffect(() => {
    console.log('PinCodeScreen > useEffect : ', pinStore);
    // 앱 초기 등록 화면이 아니고
    // 핀 코드 화면이 활성 상태 이고
    if (userStore.state === 'DONE' && pinStore.visible) checkBiometrics();
  }, [pinStore.visible]);

  const checkBiometrics = async () => {
    const hasBiometrics = await LocalAuthentication.hasHardwareAsync();
    const hasEnrolledBiometrics = await LocalAuthentication.isEnrolledAsync();

    console.log(
      'check bio :',
      hasBiometrics,
      hasEnrolledBiometrics,
      userStore.enableBio,
    );
    if (hasBiometrics && hasEnrolledBiometrics && userStore.enableBio) {
      await authenticateWithBiometrics();
    } else {
      pinStore.setMode(PinCodeT.Modes.Enter);
      pinStore.setSuccessEnter(false);
      pinStore.setVisible(true);
    }
  };

  const authenticateWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with biometrics',
    });
    console.log('bio ret :', result);
    if (result.success) {
      // Biometric authentication successful
      console.log('Biometric authentication successful');
      if (pinStore.nextScreen === 'setPincode') {
        pinStore.setMode(PinCodeT.Modes.Set);
      } else {
        enterCase();
      }
    } else {
      // Biometric authentication failed
      console.log('Biometric authentication failed');
    }
  };

  function enterCase() {
    if (pinStore.nextScreen === 'setPincode') {
      pinStore.setMode(PinCodeT.Modes.Set);
      pinStore.setNextScreen('none');
    } else {
      const nextScreen = pinStore.nextScreen;
      pinStore.setNextScreen('none');
      if (nextScreen !== 'none') RootNavigation.navigate(nextScreen);
      pinStore.setSuccessEnter(true);
      pinStore.setVisible(false);
    }
  }
  return (
    <PinCode
      pin={pinStore.code}
      visible={pinStore.visible}
      mode={pinStore.mode}
      options={{
        backSpace: <Icon name='backspace' size={24} color='white' />,
        lockIcon: <Icon name='lock' size={24} color='white' />,
        retryLockDuration: 1000,
        maxAttempt: 5,
        useFooter: pinStore.useFooter,
      }}
      textOptions={customTexts}
      styles={customStyles}
      onEnterCancel={() => {
        console.log('Cancel Enter');
        pinStore.setVisible(false);
      }}
      onEnter={() => {
        console.log('onEnter');
        enterCase();
      }}
      onSet={(newPin) => {
        console.log('onSet');
        pinStore.setCode(newPin);
        pinStore.setMode(PinCodeT.Modes.Enter);
        pinStore.setVisible(false);
      }}
      onReset={() => {
        console.log('onReset');
        pinStore.setCode(undefined);
      }}
      onSetCancel={() => {
        console.log('onSetCancel');
        pinStore.setVisible(false);
        pinStore.setMode('enter');
      }}
      onModeChanged={(lastMode, newMode) => {
        console.log('onModeChanged');
      }}
    />
  );
});

export default PinCodeScreen;
