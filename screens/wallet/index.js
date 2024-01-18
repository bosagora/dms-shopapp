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
import { Amount, BOACoin, ContractUtils } from 'dms-sdk-client';
import { convertProperValue } from '../../utils/convert';
import loyaltyStore from '../../stores/loyalty.store';
import { SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';

const Index = observer(({ navigation }) => {
  const { secretStore, userStore, loyaltyStore } = useStores();
  const [showModal, setShowModal] = useState(false);
  const [client, setClient] = useState();
  const [address, setAddress] = useState('');
  const [payablePoint, setPayablePoint] = useState(new BOACoin(0));
  const [payablePointRate, setPayablePointRate] = useState(new BOACoin(0));
  const [onePointRate, setOnePointRate] = useState(new BOACoin(0));
  const [userTokenBalance, setUserTokenBalance] = useState(new BOACoin(0));
  const [userTokenRate, setUserTokenRate] = useState(new BOACoin(0));
  const [oneTokenRate, setOneTokenRate] = useState(new BOACoin(0));
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
  async function fetchClient() {
    console.log(
      'Wallet > fetchClient',
      'userStore',
        userStore
    );
    const { client: client1, address: userAddress } = await getClient();
    console.log('>>>>>>> userAddress :', userAddress);
    setClient(client1);
    setAddress(userAddress);

    const web3Status = await client1.web3.isUp();
    console.log('web3Status :', web3Status);
    const isUp = await client1.ledger.isRelayUp();
    console.log('isUp:', isUp);

    const phone = userStore.phone;
    setPhone(phone);
    console.log('user phone :', phone);

    const loyaltyType = await client1.ledger.getLoyaltyType(userAddress);
    setUserLoyaltyType(loyaltyType);
    console.log('userLoyaltyType :', loyaltyType);

    const tokenBalance = await client1.ledger.getTokenBalance(userAddress);
    console.log('tokenBalance :', tokenBalance.toString());
    const tokenBalConv = new BOACoin(tokenBalance);
    console.log('tokenBalConv :', tokenBalConv.toBOAString());
    setUserTokenBalance(tokenBalConv);

    // const tokenAmount = Amount.make(tokenBalance, 18).value;
    let userTokenCurrencyRate = await client1.currency.tokenToCurrency(
      tokenBalance,
      'krw',
    );
    console.log('userTokenCurrencyRate :', userTokenCurrencyRate.toString());
    const oneConv = new BOACoin(userTokenCurrencyRate);
    console.log('oneConv :', oneConv.toBOAString());
    setUserTokenRate(oneConv);

    const oneTokenAmount = BOACoin.make(1, 18).value;
    let oneTokenCurrencyRate = await client1.currency.tokenToCurrency(
      oneTokenAmount,
      'krw',
    );

    console.log('oneTokenCurrencyRate :', oneTokenCurrencyRate.toString());
    const boaConv = new BOACoin(oneTokenCurrencyRate);
    console.log('boaBal :', boaConv.toBOAString());
    setOneTokenRate(boaConv);

    const userPoint = await client1.ledger.getPointBalance(userAddress);
    const payableConv = new BOACoin(userPoint);
    console.log('payableConv :', payableConv.toBOAString());
    setPayablePoint(payableConv);

    let pointCurrencyRate = await client1.currency.pointToCurrency(
      userPoint,
      userStore.currency,
    );
    const pointRateConv = new BOACoin(pointCurrencyRate);
    console.log('pointRateConv :', pointRateConv.toBOAString());
    setPayablePointRate(pointRateConv);
  }
  async function fetchBalances() {
    const loyaltyType = await client.ledger.getLoyaltyType(address);
    console.log('userLoyaltyType :', loyaltyType);
    const point = await client.ledger.getPointBalance(address);
    console.log('pointBalance :', point.toString());
    const tokenBalance = await client.ledger.getTokenBalance(address);
    console.log('tokenBalance :', tokenBalance.toString());
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

  const confirmToToken = async () => {
    console.log('confirm to token');
    let steps = [];
    try {
      for await (const step of client.ledger.changeToLoyaltyToken()) {
        steps.push(step);
        console.log('confirm to token step :', step);
      }
      if (steps.length === 3 && steps[2].key === 'done') {
        setUserLoyaltyType(1);
      }
    } catch (e) {
      console.log('error : ', e);
      await Clipboard.setStringAsync(JSON.stringify(e));
      alert('토큰 전환에 실패하였습니다.' + JSON.stringify(e));
    }
    await fetchClient();
    // await fetchBalances();

    // if (steps.length === 2 && steps[1].key === 'accepted') {
    //   completeAuth();
    // }
    //   switch (step.key) {
    //     case NormalSteps.PREPARED:
    //       expect(step.account).toEqual(userAddress);
    //       break;
    //     case NormalSteps.SENT:
    //       expect(typeof step.txHash).toBe("string");
    //       expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
    //       break;
    //     case NormalSteps.DONE:
    //       expect(step.account).toBe(userWallets[0].address);
    //       break;
    //     default:
    //       throw new Error("Unexpected change loyalty step: " + JSON.stringify(step, null, 2));
    //   }
    // }
    setShowModal(false);
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
                  나의 KIOS 마일리지 shop v0.2 - {process.env.EXPO_PUBLIC_ENV} -{' '}
                  {process.env.ENVIRONMENT}
                </Heading>
                <Text
                  _dark={{ color: '$textLight200' }}
                  fontSize='$xs'
                  my='$1.5'>
                  모든 KIOS 키오스크에서 상품 교환이 가능한 통합 {t('mileage')}
                </Text>
              </Box>

              <Divider my='$5' mr='$1' bg='$violet600' />
              {userLoyaltyType === 0 ? (
                <Box>
                  <HStack justifyContent='space-between'>
                    <HStack m='$30'>
                      <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$xl'
                        mr='$1'>
                        {convertProperValue(payablePoint.toBOAString())}
                      </Text>
                      <Text _dark={{ color: '$textLight200' }} fontSize='$sm'>
                        point
                      </Text>
                    </HStack>
                    <Pressable
                      onPress={() => navigation.navigate('MileageHistory')}>
                      <Text fontSize='$sm' color='$violet400'>
                        적립/사용 내역
                      </Text>
                    </Pressable>
                  </HStack>
                  <HStack m='$2'>
                    <Text
                      _dark={{ color: '$textLight200' }}
                      fontSize='$sm'
                      mr='$1'>
                      ≒ {convertProperValue(payablePointRate.toBOAString())} KRW
                    </Text>
                    <Text _dark={{ color: '$textLight200' }} fontSize='$sm'>
                      (1 point ≒ 1 {userStore.currency})
                    </Text>
                  </HStack>
                  <Button mt='$12' onPress={() => handleQRSheet()}>
                    <ButtonText>키오스크에서 사용하기(QR)</ButtonText>
                  </Button>
                  <Box mt='$4' alignItems='flex-end'>
                    <Pressable onPress={() => convertToToken()}>
                      <Text fontSize='$sm' color='$violet400'>
                        > 토큰으로 전환하기
                      </Text>
                    </Pressable>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <HStack justifyContent='space-between'>
                    <HStack m='$30'>
                      <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$xl'
                        mr='$1'>
                        {convertProperValue(userTokenBalance.toBOAString())}
                      </Text>
                      <Text _dark={{ color: '$textLight200' }} fontSize='$sm'>
                        KIOS
                      </Text>
                    </HStack>
                    <Pressable
                      onPress={() => navigation.navigate('MileageHistory')}>
                      <Text fontSize='$sm' color='$pink600'>
                        적립/사용 내역
                      </Text>
                    </Pressable>
                  </HStack>
                  <HStack m='$2'>
                    <Text
                      _dark={{ color: '$textLight200' }}
                      fontSize='$sm'
                      mr='$1'>
                      ≒ {convertProperValue(userTokenRate.toBOAString())} KRW
                    </Text>
                    <Text _dark={{ color: '$textLight200' }} fontSize='$sm'>
                      (1 KIOS ≒{' '}
                      {convertProperValue(oneTokenRate.toBOAString(), 2, 10)}{' '}
                      KRW)
                    </Text>
                  </HStack>
                  <Button mt='$12' onPress={() => handleQRSheet()}>
                    <ButtonText>키오스크에서 사용하기(QR)</ButtonText>
                  </Button>
                </Box>
              )}
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
                  <Heading>토큰으로 전환하기</Heading>
                  <Text size='sm'>
                    포인트를 토큰으로 전환한 후에는 다시 포인트로 전환할 수
                    없으며, 향후 마일리지는 토큰으로 지급됩니다.
                  </Text>
                  <Text size='sm'>계속 진행하려면 확인을 클릭하세요.</Text>
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
                      취소
                    </ButtonText>
                  </Button>
                  <Button
                    variant='solid'
                    bg='$success700'
                    borderColor='$success700'
                    onPress={() => {
                      confirmToToken();
                    }}>
                    <ButtonText fontSize='$sm' fontWeight='$medium'>
                      확인
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
