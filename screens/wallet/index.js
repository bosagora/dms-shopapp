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
  const [providedAmount, setProvidedAmount] = useState('0');
  const [usedAmount, setUsedAmount] = useState('0');
  const [withdrawAmount, setWithdrawAmount] = useState('0');
  const [withdrawnAmount, setWithdrawnAmount] = useState('0');
  const [withdrawableAmount, setWithdrawableAmount] = useState('0');

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


    const shopInfo = await client1.shop.getShopInfo(userStore.shopId);
    console.log('shopInfo :', shopInfo)

    const convProvidedAmount = new Amount(shopInfo.providedAmount, 18).toBOAString();
    const convUsedAmount = new Amount(shopInfo.usedAmount, 18).toBOAString();
    const convWithdrawAmount = new Amount(shopInfo.withdrawAmount, 18).toBOAString();
    const convWithdrawnAmount = new Amount(shopInfo.withdrawnAmount, 18).toBOAString();
    const withdrawableAmountTmp = await client1.shop.getWithdrawableAmount(userStore.shopId);
    const convWithdrawableAmount = new Amount(withdrawableAmountTmp, 18).toBOAString();

    setProvidedAmount(convProvidedAmount)
    setUsedAmount(convUsedAmount)
    setWithdrawAmount(convWithdrawAmount)
    setWithdrawnAmount(convWithdrawnAmount)
    setWithdrawableAmount(convWithdrawableAmount)
    console.log("provided Amount:" ,convProvidedAmount);
    console.log("used Amount:" ,convProvidedAmount);
    console.log("withdraw Amount:" ,convWithdrawAmount);
    console.log("withdrawn Amount:" ,convWithdrawnAmount);
    console.log("withdrawable Amount:" ,convWithdrawableAmount);
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
                    {userStore.shopName} v0.2 - {process.env.EXPO_PUBLIC_ENV} -{' '}
                    {process.env.ENVIRONMENT}
                  </Heading>
                  <Text
                      _dark={{ color: '$textLight200' }}
                      fontSize='$xs'
                      my='$1.5'>
                    모든 KIOS 키오스크 상점의 마일리지 제공 및 정산 내역
                  </Text>
                </Box>

                <Divider my='$5' mr='$1' bg='$violet600' />
                <Box>
                  <HStack justifyContent='space-between'>
                    <HStack m='$30'>
                      <Heading size='sm'>마일리지 제공/사용</Heading>
                    </HStack>
                    <Pressable
                        onPress={() => navigation.navigate('MileageHistory')}>
                      <Text fontSize='$sm' color='$violet400'>
                        적립/사용 내역
                      </Text>
                    </Pressable>
                  </HStack>
                  <VStack m='$2'>
                    <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$sm'
                        mr='$1'>
                      제공 : {convertProperValue(providedAmount)} KRW
                    </Text>
                    <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$sm'
                        mr='$1'>
                      사용 : {convertProperValue(usedAmount)} KRW
                    </Text>
                  </VStack>
                </Box>
                <Box h='$5'></Box>
                <Box >
                  <HStack justifyContent='space-between'>
                    <HStack m='$30'>
                      <Heading size='sm'>마일리지 정산</Heading>
                    </HStack>
                    <Pressable
                        onPress={() => navigation.navigate('MileageAdjustmentHistory')}>
                      <Text fontSize='$sm' color='$violet400'>
                        정산 내역
                      </Text>
                    </Pressable>
                  </HStack>
                  <VStack m='$2'>
                    <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$sm'
                        mr='$1'>
                      정산 중 : {convertProperValue(withdrawAmount)} KRW
                    </Text>
                    <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$sm'
                        mr='$1'>
                      정산 가능 : { convertProperValue(withdrawableAmount)} KRW
                    </Text>
                    <Text
                        _dark={{ color: '$textLight200' }}
                        fontSize='$sm'
                        mr='$1'>
                      정산 완료 : {convertProperValue(withdrawnAmount)} KRW
                    </Text>
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
