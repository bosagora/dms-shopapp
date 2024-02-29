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
import {
  checkValidPeriod,
  convertProperValue,
  isEmpty,
} from '../../utils/convert';
import { useTranslation } from 'react-i18next';

const MileageCancelNotification = observer(() => {
  const { t } = useTranslation();
  const { pinStore, loyaltyStore } = useStores();

  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');

  const [shopName, setShopName] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [amount, setAmount] = useState(new Amount(0, 18));
  const [currency, setCurrency] = useState('');
  const [hasPayment, setHasPayment] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    async function fetchClient() {
      try {
        const { client: client1, address } = await getClient();
        setClient(client1);
        setAddress(address);

        if (
          loyaltyStore.payment &&
          !isEmpty(loyaltyStore.payment) &&
          loyaltyStore.payment.type === 'cancel'
        ) {
          if (
            checkValidPeriod(
              loyaltyStore.payment.timestamp,
              loyaltyStore.payment.timeout,
            )
          ) {
            setExpired(false);
          } else {
            setExpired(true);
            alert(t('wallet.expired.alert'));
          }
          setHasPayment(true);
          await savePaymentInfo(client1, loyaltyStore.payment.id);
        } else {
          setHasPayment(false);
        }
      } catch (e) {
        alert('shop notificaiton error :' + JSON.stringify(e));
      }
    }
    fetchClient().then(() => console.log('end of fetchClient'));

    console.log('loyaltyStore :', loyaltyStore);
  }, [loyaltyStore.payment]);
  const saveShopInfo = async (cc, shopId) => {
    // get shop info
    const info = await cc.shop.getShopInfo(shopId);
    console.log('shop info : ', info);
    setShopName(info.name);
  };

  const savePaymentInfo = async (cc, paymentId) => {
    const info = await cc.ledger.getPaymentDetail(paymentId);
    console.log('payment info:', info);
    setPurchaseId(info.purchaseId);
    setAmount(new Amount(info.amount, 18));
    setCurrency(info.currency);
    await saveShopInfo(cc, info.shopId);
  };

  async function confirmCancel() {
    if (expired) {
      loyaltyStore.setPayment({});
      pinStore.setNextScreen('Wallet');
      return;
    }

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
        loyaltyStore.setPayment({});
        pinStore.setNextScreen('Wallet');
        alert(t('wallet.redeem.use.done'));
      }
    } catch (e) {
      console.log('e :', e);
      loyaltyStore.setPayment({});
      pinStore.setNextScreen('Wallet');
      alert(t('wallet.redeem.use.fail') + 'e:' + e.message);
    }
  }

  async function cancelCancel() {
    loyaltyStore.setPayment({});
    pinStore.setNextScreen('Wallet');
  }

  return hasPayment ? (
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
            {convertProperValue(amount.toBOAString())} {currency.toUpperCase()}
          </Text>
        </HStack>
        <VStack space='lg' pt='$4' m='$7'>
          <Button py='$2.5' px='$3' onPress={() => confirmCancel()}>
            <ButtonText>{t('button.press.a')}</ButtonText>
          </Button>
          <Button onPress={() => cancelCancel()}>
            <ButtonText>{t('button.press.b')}</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  ) : null;
});

export default MileageCancelNotification;
