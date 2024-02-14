import React, { useEffect, useState } from 'react';

import { styled } from '@gluestack-style/react';
import {
  AddIcon,
  Box,
  Button,
  ButtonIcon,
  VStack,
  Heading,
  ButtonText,
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  HStack,
  ActionsheetContent,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputSlot,
  InputIcon,
  InputField,
  Image,
  Text,
} from '@gluestack-ui/themed';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { getSecureValue } from '../utils/secure.store';
import QRCode from 'react-native-qrcode-svg';
import { useStores } from '../stores';
import { observer } from 'mobx-react';
import * as Clipboard from 'expo-clipboard';
import { truncateMiddleString } from '../utils/convert';
import {useTranslation} from "react-i18next";

// export default function QRActionSheet() {
const PrivacyActionSheet = observer(() => {
  const { t } = useTranslation();
  const { secretStore } = useStores();
  const [walletAddress, SetWalletAddress] = useState('');
  useEffect(() => {
    async function fetchWalletAddress() {
      const address = await getSecureValue('address');
      SetWalletAddress(address);
    }
    fetchWalletAddress();
  }, [secretStore.address]);
  const handleClose = () =>
    secretStore.setShowPrivacySheet(!secretStore.showPrivacySheet);
  return (
    <Box>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Actionsheet isOpen={secretStore.showPrivacySheet} onClose={handleClose}>
          <ActionsheetBackdrop bg='$borderLight200' />
          <ActionsheetContent maxHeight='75%'>
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <ScrollView>
            <VStack w='$full' p={20}>
              <HStack justifyContent='center' alignItems='center' space='md'>
                <Box
                  // maxWidth='$64'
                  borderColor='$borderLight200'
                  borderRadius='$lg'
                  borderWidth='$1'
                  my='$4'
                  overflow='hidden'
                  sx={{
                    '@base': {
                      mx: '$5',
                    },
                    _dark: {
                      bg: '$borderLight0',
                      borderColor: '$borderLight0',
                    },
                  }}>
                  <Box w='$full' p={20}>

                  </Box>
                  <VStack px='$6' pt='$4' pb='$6'>
                    <Text
                      color='black'
                      _dark={{ color: '$black' }}
                      size='sm'
                      p='$1.5'>

                      {t('term.privacy.detail')}
                    </Text>
                    <Button
                      variant='solid'
                      action='primary'
                      onPress={async () => {
                        handleClose();
                      }}>
                      <ButtonText fontSize='$sm' fontWeight='$medium'>
                        {t('term.read')}
                      </ButtonText>
                    </Button>
                  </VStack>
                </Box>
              </HStack>
            </VStack>
            </ScrollView>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
    </Box>
  );
});

export default PrivacyActionSheet;
