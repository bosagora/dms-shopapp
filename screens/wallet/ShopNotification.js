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
import { useTranslation } from 'react-i18next';

const ShopNotification = observer(({ navigation }) => {
  const { t } = useTranslation();
  const { loyaltyStore, userStore, pinStore } = useStores();

  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState('');
  const [taskId, setTaskId] = useState('');
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
      setTaskId(loyaltyStore.payment.taskId);
      await saveTaskInfo(client1, loyaltyStore.payment.taskId);
    }
    fetchClient().then(() => console.log('end of fetchClient'));

    console.log('loyaltyStore :', loyaltyStore);
    // initiateTimer();
  }, []);

  const saveTaskInfo = async (cc, tId) => {
    const task = await cc.shop.getTaskDetail(tId);
    // alert('task data :' + JSON.stringify(task));
    console.log('task info:', task);

    setShopId(task.shopId.toString());
    setShopName(task.name);
    setCurrency(task.currency);
  };

  async function confirmUpdate() {
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
        alert(t('wallet.shop.update.done'));
        pinStore.setNextScreen('Wallet');
        navigation.navigate('Wallet');
      }
    } catch (e) {
      console.log('e :', e);
      alert(t('wallet.shop.update.done') + 'e:' + JSON.stringify(e.message));
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
          <Box py='$10'>
            <Button py='$2.5' px='$3' onPress={() => confirmUpdate()}>
              <ButtonText>{t('button.press.a')}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default ShopNotification;
