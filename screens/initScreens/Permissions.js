import { SafeAreaView } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import * as Device from 'expo-device';

import {
  Box,
  Button,
  ButtonIcon,
  ButtonText,
  Checkbox,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  EditIcon,
  Heading,
  HStack,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { CheckIcon } from 'lucide-react-native';
import MobileHeader from '../../components/MobileHeader';
import { Link } from 'expo-router';

const Permissions = observer(({ navigation }) => {
  const { noteStore, userStore } = useStores();
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
    alert('checkPushToken 3');
    return true;
  }
  function agreePermissions() {
    console.log('agreePermissions >');
    if (Device.isDevice) {
      if (checkPushToken()) {
        navigation.navigate('Term');
      } else {
        alert('알림 허용이 필요합니다.');
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
          title='앱 권한 동의'
          subTitle='서비스 이용을 위한 권한 요청'></MobileHeader>

        <VStack space='lg' pt='$4' m='$7'>
          <VStack px='$6' pt='$4' pb='$6'>
            <Heading _dark={{ color: '$textLight200' }} size='sm'>
              푸시 알림 권한
            </Heading>
            <Text my='$1.5' _dark={{ color: '$textLight200' }} fontSize='$xs'>
              통합 마일리지 사용 중에 사용을 확인, 취소 하는 등의 알림을
              사용자에게 통보하기 위해 모바일 푸시 알림 권한을 승인해야만
              정상적인 서비스 이용이 가능합니다.
            </Text>
            <Text my='$1.5' _dark={{ color: '$textLight200' }} fontSize='$xs'>
              알림 설정이 되어있지 않은 경우, 설정 &gt; KIOS &gt; 알림 에서
              '알림 허용' 을 선택해 주세요.
            </Text>
          </VStack>

          <Box py='$10'>
            <Button py='$2.5' px='$3' onPress={() => agreePermissions()}>
              <ButtonText>확인</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default Permissions;
