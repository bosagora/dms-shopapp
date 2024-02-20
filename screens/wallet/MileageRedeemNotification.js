import { SafeAreaView } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import MobileHeader from '../../components/MobileHeader';
import '@ethersproject/shims';
import { Amount, NormalSteps } from 'dms-sdk-client';
import { getClient } from '../../utils/client';
import { convertProperValue } from '../../utils/convert';
import { useTranslation } from 'react-i18next';

const MileageRedeemNotification = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { pinStore, loyaltyStore } = useStores();

  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');

  const [shopName, setShopName] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [amount, setAmount] = useState(new Amount(0, 18));
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    async function fetchClient() {
      const { client: client1, address } = await getClient();
      setClient(client1);
      setAddress(address);

      const web3Status = await client1.web3.isUp();
      console.log('web3Status :', web3Status);
      const isUp = await client1.ledger.isRelayUp();
      console.log('isUp:', isUp);
      await savePaymnentInfo(client1, loyaltyStore.payment.id);
    }
    fetchClient().then(() => console.log('end of fetchClient'));

    console.log('loyaltyStore :', loyaltyStore);
  }, []);
  const saveShopInfo = async (cc, shopId) => {
    // get shop info
    const info = await cc.shop.getShopInfo(shopId);
    console.log('shop info : ', info);
    setShopName(info.name);
  };

  const savePaymnentInfo = async (cc, paymentId) => {
    const info = await cc.ledger.getPaymentDetail(paymentId);
    console.log('payment info:', info);
    setPurchaseId(info.purchaseId);
    setAmount(new Amount(info.amount, 18));
    setCurrency(info.currency);
    await saveShopInfo(cc, info.shopId);
  };

  async function confirmCancel() {
    try {
      const steps = [];
      const isUp = await client.ledger.isRelayUp();
      for await (const step of client.ledger.approveCancelPayment(
        loyaltyStore.payment.id,
        purchaseId,
        true,
      )) {
        steps.push(step);
        console.log('confirmCancel step :', step);
        switch (step.key) {
          case NormalSteps.PREPARED:
            break;
          case NormalSteps.SENT:
            break;
          case NormalSteps.APPROVED:
            break;
          default:
            throw new Error(
              'Unexpected pay point step: ' + JSON.stringify(step, null, 2),
            );
        }
      }
      if (steps.length === 3 && steps[2].key === 'approved') {
        const time = Math.round(+new Date() / 1000);
        loyaltyStore.setLastUpdateTime(time);
        alert(t('wallet.redeem.use.done'));
        loyaltyStore.setPayment(null);
        pinStore.setNextScreen('Wallet');
        navigation.navigate('Wallet');
      }
    } catch (e) {
      console.log('e :', e);
      alert(t('wallet.redeem.use.fail') + 'e:' + e.message);
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
          title={t('wallet.redeem.header.title')}
          subTitle={t('wallet.redeem.header.subtitle')}
        />

        <VStack space='lg' pt='$4' m='$7'>
          <HStack>
            <Text w='40%'>{t('shop')} :</Text>
            <Text>{shopName}</Text>
          </HStack>
          <HStack>
            <Text w='40%'>{t('purchase')} ID :</Text>
            <Text>{purchaseId}</Text>
          </HStack>
          <HStack>
            <Text w='40%'>
              {t('purchase')} {t('amount')} :{' '}
            </Text>
            <Text>
              {convertProperValue(amount.toBOAString())}{' '}
              {currency.toUpperCase()}
            </Text>
          </HStack>
          <Box py='$10'>
            <Button py='$2.5' px='$3' onPress={() => confirmCancel()}>
              <ButtonText>{t('button.press.a')}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default MileageRedeemNotification;
