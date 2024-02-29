import { SafeAreaView, View } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import { checkValidPeriod, getUnixTime, isEmpty } from '../../utils/convert';

const ShopNotification = observer(() => {
  const { t } = useTranslation();
  const { loyaltyStore, userStore, pinStore } = useStores();

  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState('');
  const [taskId, setTaskId] = useState('');
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
          loyaltyStore.payment.type === 'shop_update'
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
          setTaskId(loyaltyStore.payment.taskId);
          await saveTaskInfo(client1, loyaltyStore.payment.taskId);
        } else {
          setHasPayment(false);
        }
      } catch (e) {
        alert('shop notificaiton error :' + JSON.stringify(e));
      }
    }
    fetchClient().then(() => console.log('end of fetchClient'));

    console.log('loyaltyStore :', loyaltyStore);
    // initiateTimer();
  }, [loyaltyStore.payment]);

  const saveTaskInfo = async (cc, tId) => {
    const task = await cc.shop.getTaskDetail(tId);
    // alert('task data :' + JSON.stringify(task));
    console.log('task info:', task);

    setShopId(task.shopId.toString());
    setShopName(task.name);
    setCurrency(task.currency);
  };

  async function confirmUpdate() {
    if (expired) {
      loyaltyStore.setPayment({});
      pinStore.setNextScreen('Wallet');
      return;
    }
    try {
      const steps = [];
      const isUp = await client.ledger.isRelayUp();
      for await (const step of client.shop.approveUpdate(
        taskId,
        shopId,
        true,
      )) {
        steps.push(step);
        console.log('confirmUpdate step :', step);
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
        userStore.setCurrency(currency.toUpperCase());
        userStore.setShopName(shopName);
        loyaltyStore.setPayment({});
        pinStore.setNextScreen('Wallet');
        alert(t('wallet.shop.update.done'));
      }
    } catch (e) {
      console.log('e :', e);
      loyaltyStore.setPayment({});
      pinStore.setNextScreen('Wallet');
      alert(t('wallet.shop.update.fail') + 'e:' + JSON.stringify(e.message));
    }
  }
  async function cancelUpdate() {
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
        title={t('wallet.shop.update.header.title')}
        subTitle={t('wallet.shop.update.header.subtitle')}
      />

      <VStack space='lg' pt='$4' m='$7'>
        <HStack>
          <Text w='40%'>{t('shop')} :</Text>
          <Text>{shopName}</Text>
        </HStack>
        <HStack>
          <Text w='40%'>{t('shop.body.text.b')} :</Text>
          <Text>{currency.toUpperCase()}</Text>
        </HStack>
        <VStack space='lg' pt='$4' m='$7'>
          <Button onPress={() => confirmUpdate()}>
            <ButtonText>{t('button.press.a')}</ButtonText>
          </Button>
          <Button onPress={() => cancelUpdate()}>
            <ButtonText>{t('button.press.b')}</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  ) : null;
});

export default ShopNotification;
