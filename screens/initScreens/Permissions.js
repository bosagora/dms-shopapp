import { SafeAreaView } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import * as Device from 'expo-device';

import {
  Box,
  Button,
  ButtonText,
  Heading,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader';
import { useTranslation } from 'react-i18next';

const Permissions = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { userStore } = useStores();
  const [values, setValues] = useState(['T1', 'T2']);
  useEffect(() => {
    console.log(
      'Permissions Screen > expoPushToken :',
      userStore.expoPushToken,
    );
    userStore.setLoading(false);
  }, []);

  function checkPushToken() {
    console.log('checkPushToken > permision count', userStore.permissionsCount);
    console.log('checkPushToken >expoPushToken', userStore.expoPushToken);
    if (userStore.expoPushToken === '') return false;
    console.log('1');
    if (userStore.expoPushToken.length < 10) return false;
    console.log('2');
    if (!userStore.expoPushToken.includes('ExponentPushToken')) return false;
    return true;
  }
  function agreePermissions() {
    console.log('agreePermissions >');
    if (Device.isDevice) {
      if (checkPushToken()) {
        navigation.navigate('Term');
      } else {
        alert(t('permission.agree.alert'));
        userStore.setPermissionsCount();
      }
    } else {
      navigation.navigate('Term');
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
          title={t('permission.header.title')}
          subTitle={t('permission.header.subtitle')}></MobileHeader>

        <VStack space='lg' pt='$4' m='$7'>
          <VStack px='$6' pt='$4' pb='$6'>
            <Heading _dark={{ color: '$textLight200' }} size='sm'>
              {t('permission.body.heading')}
            </Heading>
            <Text my='$1.5' _dark={{ color: '$textLight200' }} fontSize='$xs'>
              {t('permission.body.text.a')}
            </Text>
            <Text my='$1.5' _dark={{ color: '$textLight200' }} fontSize='$xs'>
              {t('permission.body.text.b')}
            </Text>
          </VStack>

          <Box py='$10'>
            <Button py='$2.5' px='$3' onPress={() => agreePermissions()}>
              <ButtonText>{t('button.press.a')}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default Permissions;
