import { Platform, SafeAreaView } from 'react-native';
import { trunk, useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';

import { getSecureValue, saveSecureValue } from '../../utils/secure.store';
import ImportPrivateKey from '../../components/ImportPrivateKey';
import {
  Box,
  ButtonText,
  Button,
  Center,
  VStack,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  Heading,
  Text,
  FormControl,
  FormControlHelper,
  FormControlHelperText,
  Input,
  View,
  InputField,
  ButtonGroup,
  Icon,
  ModalCloseButton,
  ModalHeader,
  CloseIcon,
} from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader'; //for ethers.js
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getClient } from '../../utils/client';
import * as Device from 'expo-device';
import { ContractUtils, MobileType } from 'dms-sdk-client';
import { AUTH_STATE } from '../../stores/user.store';
import { useTranslation } from 'react-i18next';

const { Wallet } = ethers;

const WalletManager = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { userStore, secretStore, loyaltyStore, pinStore } = useStores();
  const [privateKey, setPrivateKey] = useState(
    '0000000000000000000000000000000000000000000000000000000000000001',
  );
  const [showModal, setShowModal] = useState(false);
  const [showInitWalletModal, setShowInitWalletModal] = useState(false);
  const [client, setClient] = useState();
  const [address, setAddress] = useState('');

  const [fromOtherWallet, setFromOtherWallet] = useState(false);

  const fetchClient = async () => {
    const { client: client1, address: userAddress } = await getClient();
    setClient(client1);
    setAddress(userAddress);

    console.log('Secret fetch > client1 :', client1);
    return client1;
  };
  async function registerPushTokenWithClient(cc) {
    console.log('registerPushTokenWithClient >>>>>>>> cc:', cc);
    const token = userStore.expoPushToken;
    console.log('token :', token);
    const language = 'kr';
    const os = Platform.OS === 'android' ? 'android' : 'iOS';
    try {
      await cc.ledger.registerMobileToken(
        token,
        language,
        os,
        MobileType.SHOP_APP,
      );
      return true;
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      alert(t('secret.alert.push.fail') + JSON.stringify(e.message));
      return false;
    }
  }

  useEffect(() => {
    async function fetchKey() {
      const key = await getSecureValue('privateKey');
      setPrivateKey(key);
    }
    fetchKey();
  }, []);

  async function exportWallet() {
    setShowModal(true);
  }

  async function saveKey(key) {
    key = key.trim();
    let wallet;
    try {
      wallet = new Wallet(key);
    } catch (e) {
      console.log('Invalid private key.');
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
      const ret = await registerPushTokenWithClient(client);
      if (ret) {
        alert(t('config.wallet.alert.import.done'));
        navigation.navigate('Wallet');
      } else {
        alert(t('config.wallet.alert.import.fail'));
      }
    } else {
      console.log('Not on device.');
      alert(t('config.wallet.alert.import.done'));
      navigation.navigate('Wallet');
    }
  }

  async function warnInitializeWallet() {
    setShowInitWalletModal(true);
  }
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
          title={t('config.wallet.header.title')}
          subTitle={t('config.wallet.header.subtitle')}
        />
        <VStack space='lg' pt='$4' m='$7'>
          <Box>
            <Button py='$2.5' px='$3' onPress={() => exportWallet()}>
              <ButtonText>{t('wallet.export')}</ButtonText>
            </Button>
          </Box>
          <ImportPrivateKey
            saveKey={saveKey}
            fromOtherWallet={fromOtherWallet}
            afterSelectingShop={afterSelectingShop}
            client={client}
          />
          <Box>
            <Button py='$2.5' px='$3' onPress={() => warnInitializeWallet()}>
              <ButtonText>{t('wallet.init')}</ButtonText>
            </Button>
          </Box>
        </VStack>
        <Box>
          <KeyboardAwareScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ marginBottom: 150 }}
            enableOnAndroid={true}
            scrollEnabled={true}
            extraScrollHeight={100}
            keyboardShouldPersistTaps='handled'
            scrollToOverflowEnabled={true}
            enableAutomaticScroll={true}>
            <View>
              <Modal
                isOpen={showModal}
                onClose={() => {
                  setShowModal(false);
                }}>
                <ModalBackdrop />
                <ModalContent maxWidth='$96'>
                  <ModalHeader>
                    <Heading size='lg'>
                      {t('config.wallet.modal.heading')}
                    </Heading>
                    <ModalCloseButton>
                      <Icon as={CloseIcon} />
                    </ModalCloseButton>
                  </ModalHeader>
                  <ModalBody p='$5'>
                    <VStack space='xs' mb='$4'>
                      <Text size='sm'>
                        {t('config.wallet.modal.body.text.a')}
                      </Text>
                      <Text size='sm'>
                        {t('config.wallet.modal.body.text.b')}
                      </Text>
                    </VStack>
                    <VStack py='$2' space='xl'>
                      <FormControl>
                        <FormControlHelper>
                          <FormControlHelperText>
                            {t('config.wallet.modal.body.text.c')}
                          </FormControlHelperText>
                        </FormControlHelper>
                        <Input>
                          <InputField value={privateKey} />
                        </Input>
                      </FormControl>
                      <FormControl>
                        <FormControlHelper>
                          <FormControlHelperText>
                            {t('config.wallet.modal.body.text.d')}
                          </FormControlHelperText>
                        </FormControlHelper>
                        <Input>
                          <InputField value={userStore.shopId} />
                        </Input>
                      </FormControl>
                    </VStack>

                    <ButtonGroup space='md' alignSelf='center'>
                      {/*<Button*/}
                      {/*  variant='outline'*/}
                      {/*  py='$2.5'*/}
                      {/*  action='secondary'*/}
                      {/*  onPress={() => {*/}
                      {/*    setShowModal(false);*/}
                      {/*  }}>*/}
                      {/*  <ButtonText fontSize='$sm' fontWeight='$medium'>*/}
                      {/*    Close*/}
                      {/*  </ButtonText>*/}
                      {/*</Button>*/}
                      <Button
                        variant='solid'
                        bg='$success700'
                        borderColor='$success700'
                        onPress={async () => {
                          await Clipboard.setStringAsync(privateKey);
                          setShowModal(false);
                        }}>
                        <ButtonText fontSize='$sm' fontWeight='$medium'>
                          {t('config.wallet.modal.body.text.e')}
                        </ButtonText>
                      </Button>
                      <Button
                        variant='solid'
                        bg='$success700'
                        borderColor='$success700'
                        onPress={async () => {
                          await Clipboard.setStringAsync(userStore.shopId);
                          setShowModal(false);
                        }}>
                        <ButtonText fontSize='$sm' fontWeight='$medium'>
                          {t('config.wallet.modal.body.text.f')}
                        </ButtonText>
                      </Button>
                    </ButtonGroup>
                  </ModalBody>
                </ModalContent>
              </Modal>

              <Modal
                isOpen={showInitWalletModal}
                onClose={() => {
                  setShowInitWalletModal(false);
                }}>
                <ModalBackdrop />
                <ModalContent maxWidth='$96'>
                  <ModalHeader>
                    <Heading size='lg'>{t('wallet.init')}</Heading>
                    <ModalCloseButton>
                      <Icon as={CloseIcon} />
                    </ModalCloseButton>
                  </ModalHeader>
                  <ModalBody p='$5'>
                    <VStack space='xs' mb='$4'>
                      <Text size='sm'>
                        {t('config.wallet.modal.body.text.g')}
                      </Text>
                      <Text size='sm'>
                        {t('config.wallet.modal.body.text.h')}
                      </Text>
                    </VStack>

                    <ButtonGroup space='md' alignSelf='center'>
                      <Button
                        variant='solid'
                        bg='$success700'
                        borderColor='$success700'
                        onPress={async () => {
                          setShowInitWalletModal(false);
                        }}>
                        <ButtonText fontSize='$sm' fontWeight='$medium'>
                          {t('button.press.b')}
                        </ButtonText>
                      </Button>
                      <Button
                        variant='solid'
                        bg='$success700'
                        borderColor='$success700'
                        onPress={async () => {
                          setShowInitWalletModal(false);
                          await initAuth();
                        }}>
                        <ButtonText fontSize='$sm' fontWeight='$medium'>
                          {t('button.press.a')}
                        </ButtonText>
                      </Button>
                    </ButtonGroup>
                  </ModalBody>
                </ModalContent>
              </Modal>
            </View>
          </KeyboardAwareScrollView>
        </Box>
      </Box>
    </SafeAreaView>
  );
});

export default WalletManager;
