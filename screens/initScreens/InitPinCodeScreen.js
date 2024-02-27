import React, { useState } from 'react';
import { PinCode, PinCodeT } from 'react-native-pincode-bosagora-ys';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import { useTranslation } from 'react-i18next';

const InitPinCodeScreen = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { pinStore } = useStores();
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
  };

  const customStyles = {
    main: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99,
      backgroundColor: '#1f2937',
    },
    enter: {
      ...EnterAndSet,
      buttonTextDisabled: { color: 'gray' },
      pin: { backgroundColor: '#a78bfa' },
    },
    set: EnterAndSet,
    locked: {
      countdown: { borderColor: 'black' },
      countdownText: { color: 'black' },
    },
    reset: {
      confirmText: { color: '#a78bfa' },
    },
  };
  return (
    <PinCode
      pin={pinStore.code}
      visible={true}
      mode={PinCodeT.Modes.Set}
      options={{
        backSpace: <Icon name='backspace' size={24} color='white' />,
        lockIcon: <Icon name='lock' size={24} color='white' />,
        retryLockDuration: 1000,
        maxAttempt: 5,
      }}
      textOptions={customTexts}
      styles={customStyles}
      onSet={(newPin) => {
        pinStore.setCode(newPin);
        pinStore.setMode(PinCodeT.Modes.Enter);
        navigation.navigate('Secret');
      }}
      onSetCancel={() => navigation.goBack()}
    />
  );
});

export default InitPinCodeScreen;
