import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../../stores';
import {
  Box,
  Heading,
  VStack,
  Text,
  HStack,
  View,
  Divider,
  Button,
  ButtonText,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  ButtonGroup,
} from '@gluestack-ui/themed';
import { getClient } from '../../utils/client';
import {
  Amount,
  BOACoin,
  ContractUtils,
  ShopWithdrawStatus,
} from 'dms-sdk-client';
import { convertProperValue } from '../../utils/convert';
import loyaltyStore from '../../stores/loyalty.store';
import { SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { BigNumber } from '@ethersproject/bignumber/src.ts';
import { getSecureValue, saveSecureValue } from '../../utils/secure.store';
import '@ethersproject/shims';
import { Wallet } from 'ethers';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const Index = observer(({ navigation }) => {
  const { noteStore, secretStore, userStore, loyaltyStore } = useStores();
  const [showModal, setShowModal] = useState(false);
  const [client, setClient] = useState();
  const [address, setAddress] = useState('');
  const [modalHeader, setModalHeader] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [adjustmentMode, setAdjustmentMode] = useState('');

  const [adjustmentStatus, setAdjustmentStatus] = useState(0);
  const [providedAmount, setProvidedAmount] = useState(new Amount(0, 18));
  const [usedAmount, setUsedAmount] = useState(new Amount(0, 18));
  const [withdrawAmount, setWithdrawAmount] = useState(new Amount(0, 18));
  const [withdrawnAmount, setWithdrawnAmount] = useState(new Amount(0, 18));
  const [withdrawableAmount, setWithdrawableAmount] = useState(
    new Amount(0, 18),
  );
  const [privateKey, setPrivateKey] = useState('');
  const [userLoyaltyType, setUserLoyaltyType] = useState(0);
  const [phone, setPhone] = useState('');
  const { t } = useTranslation();
  useEffect(() => {
    console.log('================= userStore', userStore);

    fetchClient().then(() =>
      console.log(
        'end of wallet fetch client > last :',
        loyaltyStore.lastUpdateTime,
      ),
    );
  }, [loyaltyStore.lastUpdateTime]);

  useEffect(() => {
    const newVersion = process.env.EXPO_PUBLIC_APP_VERSION;
    console.log('version : ', noteStore.version, ', newVersion :', newVersion);
    if (Device.isDevice) {
      if (noteStore.version === '0.0.0') {
        noteStore.setVersion(newVersion);
      } else if (noteStore.version !== newVersion) {
      }
    }
  }, []);

  async function fetchClient() {
    console.log('Wallet > fetchClient', 'userStore', userStore);
    const { client: client1, address: userAddress } = await getClient();
    console.log('>>>>>>> userAddress :', userAddress);
    setClient(client1);
    setAddress(userAddress);

    const web3Status = await client1.web3.isUp();
    console.log('web3Status :', web3Status);
    const isUp = await client1.ledger.isRelayUp();
    console.log('isUp:', isUp);

    await setData(client1);
    await fetchBalances(client1);
  }
  async function fetchBalances(cc, userAddress) {
    if (userStore.walletInterval > 0) clearInterval(userStore.walletInterval);

    const id = setInterval(async () => {
      try {
        await setData(cc, userAddress);
      } catch (e) {
        console.log('setData > e:', e);
      }
    }, 5000);
    userStore.setWalletInterval(id);
  }

  async function setData(c) {
    const pkey = await getSecureValue('privateKey');
    if (pkey !== privateKey) {
      await c.useSigner(new Wallet(pkey));
      setPrivateKey(pkey);
    }

    const shopInfo = await c.shop.getShopInfo(userStore.shopId);
    // console.log('shopInfo :', shopInfo);
    setAdjustmentStatus(shopInfo.withdrawStatus);

    const convProvidedAmount = new Amount(shopInfo.providedAmount, 18);
    const convUsedAmount = new Amount(shopInfo.usedAmount, 18);
    const convWithdrawAmount = new Amount(shopInfo.withdrawAmount, 18);
    const convWithdrawnAmount = new Amount(shopInfo.withdrawnAmount, 18);
    const withdrawableAmountTmp =
      shopInfo.withdrawStatus === 0
        ? await c.shop.getWithdrawableAmount(userStore.shopId)
        : new Amount(0, 18).value;
    const convWithdrawableAmount = new Amount(withdrawableAmountTmp, 18);

    setProvidedAmount(convProvidedAmount);
    setUsedAmount(convUsedAmount);
    setWithdrawAmount(convWithdrawAmount);
    setWithdrawnAmount(convWithdrawnAmount);
    setWithdrawableAmount(convWithdrawableAmount);
    // console.log('provided Amount:', convProvidedAmount.toBOAString());
    // console.log('used Amount:', convProvidedAmount.toBOAString());
    // console.log('withdraw Amount:', convWithdrawAmount.toBOAString());
    // console.log('withdrawn Amount:', convWithdrawnAmount.toBOAString());
    // console.log('withdrawable Amount:', convWithdrawableAmount.toBOAString());
    // console.log('wAdjustmentStatus :', adjustmentStatus);
    // console.log(
    //   ' withdrawableAmount.value.gt(BigNumber.from(0)) :',
    //   withdrawableAmount.value.gt(BigNumber.from(0)),
    // );
  }
  const handleQRSheet = async () => {
    // await fetchPoints();
    secretStore.setShowQRSheet(!secretStore.showQRSheet);
    console.log('handle QR sheet : ', secretStore.showQRSheet);
  };

  const convertToToken = () => {
    console.log('convert to token');
    setShowModal(true);
  };

  const confirmModal = async () => {
    console.log('confirm');
    setShowModal(false);
    userStore.setLoading(true);

    const steps = [];
    if (adjustmentMode === 'request') {
      try {
        for await (const step of client.shop.openWithdrawal(
          userStore.shopId,
          withdrawableAmount.value,
        )) {
          steps.push(step);
          console.log('request step :', step);
        }
        if (steps.length === 3 && steps[2].key === 'done') {
          alert(t('wallet.modal.b.alert.done'));
        }
        userStore.setLoading(false);
      } catch (e) {
        await Clipboard.setStringAsync(JSON.stringify(e));
        console.log('error : ', e);
        userStore.setLoading(false);
        alert(t('wallet.modal.b.alert.fail') + JSON.stringify(e.message));
      }
    } else if (adjustmentMode === 'complete') {
      try {
        for await (const step of client.shop.closeWithdrawal(
          userStore.shopId,
        )) {
          steps.push(step);
          console.log('request step :', step);
        }
        if (steps.length === 3 && steps[2].key === 'done') {
          alert(t('wallet.modal.a.alert.done'));
        }
        userStore.setLoading(false);
      } catch (e) {
        await Clipboard.setStringAsync(JSON.stringify(e));
        console.log('error : ', e);
        userStore.setLoading(false);
        alert(t('wallet.modal.a.alert.fail') + JSON.stringify(e.message));
      }
    }
  };

  const handleComplete = () => {
    console.log('handle complete');
    setModalHeader(t('wallet.modal.a.heading'));
    setModalContent(t('wallet.modal.a.heading.description'));
    setAdjustmentMode('complete');
    setShowModal(true);
  };

  const handleRequest = () => {
    console.log('handle request');
    setModalHeader(t('wallet.modal.b.heading'));
    setModalContent(t('wallet.modal.b.heading.description'));
    setAdjustmentMode('request');
    setShowModal(true);
  };

  return (
    <SafeAreaView>
      <View
        h='$full'
        sx={{
          _dark: {
            bg: '$backgroundDark800',
            borderColor: '$borderDark800',
          },
        }}>
        <VStack justifyContent='center' alignItems='center' p='$5'>
          <HStack>
            <Box
              // maxWidth='$64'
              w='$full'
              h='$full'
              borderColor='$backgroundDark900'
              borderRadius='$xl'
              borderWidth='$1'
              p='$4'
              overflow='hidden'
              sx={{
                '@base': {
                  m: '$3',
                },
                _dark: {
                  bg: '$backgroundDark900',
                  borderColor: '$backgroundDark600',
                },
              }}>
              <Box>
                <Heading _dark={{ color: '$textLight200' }} size='lg'>
                  {userStore.shopName}
                </Heading>
                <Text
                  _dark={{ color: '$textLight200' }}
                  fontSize='$xs'
                  my='$1.5'>
                  {t('wallet.heading.description')}
                </Text>
              </Box>

              <Divider my='$5' mr='$1' bg='$violet600' />
              <Box>
                <HStack justifyContent='space-between'>
                  <HStack m='$30'>
                    <Heading size='md'>{t('wallet.modal.body.a')}</Heading>
                  </HStack>
                  <Pressable
                    onPress={() => navigation.navigate('MileageHistory')}>
                    <Text fontSize='$sm' color='$violet400'>
                      {t('wallet.link.history.redemption')}
                    </Text>
                  </Pressable>
                </HStack>
                <VStack m='$2'>
                  <Box p='$1'>
                    <Text _dark={{ color: '$textLight200' }} size='md' mr='$1'>
                      {t('wallet.modal.body.b')} :{' '}
                      {convertProperValue(
                        providedAmount.toBOAString(),
                        userStore.currency,
                      )}{' '}
                      {userStore.currency.toUpperCase()}
                    </Text>
                  </Box>
                  <Box p='$1'>
                    <Text _dark={{ color: '$textLight200' }} size='md' mr='$1'>
                      {t('wallet.modal.body.c')}:{' '}
                      {convertProperValue(
                        usedAmount.toBOAString(),
                        userStore.currency,
                      )}{' '}
                      {userStore.currency.toUpperCase()}
                    </Text>
                  </Box>
                </VStack>
              </Box>
              <Box h='$2'></Box>
              <Box>
                <HStack justifyContent='space-between'>
                  <HStack m='$30'>
                    <Heading size='md'>{t('wallet.modal.body.d')}</Heading>
                  </HStack>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('MileageAdjustmentHistory')
                    }>
                    <Text fontSize='$sm' color='$violet400'>
                      {t('wallet.link.history.settlement')}
                    </Text>
                  </Pressable>
                </HStack>
                <VStack m='$2'>
                  <Box p='$1'>
                    <HStack alignItems='center'>
                      <Text
                        _dark={{ color: '$textLight200' }}
                        size='sm'
                        mr='$2'>
                        {t('wallet.modal.body.e')} :{' '}
                        {adjustmentStatus === ShopWithdrawStatus.OPEN
                          ? convertProperValue(
                              withdrawAmount.toBOAString(),
                              userStore.currency,
                            )
                          : convertProperValue(
                              new Amount(0, 18).toBOAString(),
                              userStore.currency,
                            )}{' '}
                        {userStore.currency.toUpperCase()}
                      </Text>
                      {adjustmentStatus === ShopWithdrawStatus.OPEN ? (
                        <Button
                          size='xs'
                          h={25}
                          onPress={() => handleComplete()}>
                          <ButtonText size='xs'>
                            {t('wallet.modal.body.g')}
                          </ButtonText>
                        </Button>
                      ) : null}
                    </HStack>
                  </Box>
                  <Box p='$1'>
                    <HStack alignItems='center'>
                      <Text
                        _dark={{ color: '$textLight200' }}
                        size='sm'
                        mr='$2'>
                        {t('wallet.modal.body.f')} :{' '}
                        {convertProperValue(withdrawableAmount.toBOAString())}{' '}
                        KRW
                      </Text>
                      {adjustmentStatus !== ShopWithdrawStatus.OPEN &&
                      withdrawableAmount.value.gt(BigNumber.from(0)) ? (
                        <Button
                          size='xs'
                          h={25}
                          onPress={() => handleRequest()}>
                          <ButtonText size='xs'>
                            {t('wallet.modal.body.e')}
                          </ButtonText>
                        </Button>
                      ) : null}
                    </HStack>
                  </Box>

                  <Box p='$1'>
                    <Text _dark={{ color: '$textLight200' }} size='sm' mr='$2'>
                      {t('wallet.modal.body.g')} :{' '}
                      {convertProperValue(withdrawnAmount.toBOAString())} KRW
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Box>
          </HStack>
        </VStack>

        <Box>
          <Modal
            isOpen={showModal}
            size='lg'
            onClose={() => {
              setShowModal(false);
            }}>
            <ModalBackdrop />
            <ModalContent maxWidth='$96'>
              <ModalBody p='$5'>
                <VStack space='lg' mb='$4'>
                  <Heading>{modalHeader}</Heading>
                  <Text size='sm'>{modalContent}</Text>
                  <Text size='sm'>{t('wallet.modal.body.h')} </Text>
                </VStack>

                <ButtonGroup space='md' alignSelf='center'>
                  <Button
                    variant='outline'
                    py='$2.5'
                    action='secondary'
                    onPress={() => {
                      setShowModal(false);
                    }}>
                    <ButtonText fontSize='$sm' fontWeight='$medium'>
                      {t('button.press.b')}
                    </ButtonText>
                  </Button>
                  <Button
                    variant='solid'
                    bg='$success700'
                    borderColor='$success700'
                    onPress={() => {
                      confirmModal();
                    }}>
                    <ButtonText fontSize='$sm' fontWeight='$medium'>
                      {t('button.press.a')}
                    </ButtonText>
                  </Button>
                </ButtonGroup>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
      </View>
    </SafeAreaView>
  );
});

export default Index;
