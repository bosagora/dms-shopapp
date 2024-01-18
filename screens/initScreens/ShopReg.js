import {
  Input,
  InputField,
  Button,
  Heading,
  FormControl,
  ButtonText,
  useToast,
  VStack,
  Box,
  HStack,
  Text,
  Divider,
  FormControlLabel,
  FormControlLabelText,
  SelectInput,
  SelectTrigger,
  SelectIcon,
  Icon,
  SelectBackdrop,
  SelectPortal, SelectDragIndicatorWrapper, SelectContent, SelectItem, Select, SelectDragIndicator,
} from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native';
import { useFormik } from 'formik';
import * as yup from 'yup';
import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { AUTH_STATE } from '../../stores/user.store';
import { useStores } from '../../stores';
import '@ethersproject/shims';
import { ContractUtils } from 'dms-sdk-client';
import * as Clipboard from 'expo-clipboard';
import { getLocales, getCalendars } from 'expo-localization';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getClient } from '../../utils/client';
import {ChevronDownIcon} from "lucide-react-native";

const registerSchema = yup.object().shape({
  n1: yup
    .string()
    .required()


});

const registerInitialValues = {
  n1: '',

};

const ShopReg = observer(({ navigation }) => {
  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');
  const [phoneCode, setPhoneCode] = useState('01010002000');
  const [shopName, setShopName] = useState('');
  const toast = useToast();
  const { userStore } = useStores();

  useEffect(() => {
    async function fetchClient() {
      console.log('ShopReg > fetchClient');
      const { client, address } = await getClient();
      setClient(client);
      setAddress(address);

      const web3Status = await client.web3.isUp();
      console.log('web3Status :', web3Status);
      const isUp = await client.ledger.isRelayUp();
      console.log('isUp:', isUp);
    }
    fetchClient().then(() => console.log('end of fetchClient'));
    const deviceLocales = getLocales()[0];
    console.log('deviceLocales :', deviceLocales);
    // initiateTimer();
    userStore.setCurrency(deviceLocales.currencyCode.toLowerCase());
    userStore.setLang(deviceLocales.languageCode.toLowerCase());
    userStore.setCountry(deviceLocales.regionCode.toLowerCase());
    userStore.setLangTag(deviceLocales.languageTag);
    userStore.setCountryPhoneCode(deviceLocales.regionCode == 'KR' ? '82' : '');
  }, []);



  async function regShop() {
    userStore.setLoading(true);
    const shopId = ContractUtils.getShopId(address);
    userStore.setShopId(shopId);
    userStore.setShopName(formik.values?.n1);
    const shopData = {
      shopId,
      name: formik.values?.n1,
      currency: userStore.currency,
      address: address,
    }
    console.log('ShopData : ', shopData)
    const steps = [];
    try {
      for await (const step of client.shop.add(shopData.shopId, shopData.name, shopData.currency)) {
        steps.push(step);
        console.log('submit step :', step);
      }
      userStore.setLoading(false);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      userStore.setLoading(false);
      alert('상점 등록에 실패하였습니다.' + JSON.stringify(e));
    }
  }

  const formik = useFormik({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,

    onSubmit: (values, { resetForm }) => {
      console.log('form values :', values);
      regShop().then((r) => {
        userStore.setAuthState(AUTH_STATE.DONE);
      });
      resetForm();
    },
  });

  const onPressCurrency = (it) => {
    console.log('it:', it)
    userStore.setCurrency(it)
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
        <KeyboardAwareScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          // style={{ marginBottom: 150 }}
          enableOnAndroid={true}
          scrollEnabled={true}
          extraScrollHeight={100}
          keyboardShouldPersistTaps='handled'
          scrollToOverflowEnabled={true}
          enableAutomaticScroll={true}>
          <MobileHeader />

          <Box
            p='$4'
            flex={1}
            maxWidth='$96'
            alignSelf='center'
            // justifyContent='center'
            w='$full'>

            <VStack py="$2" space="xl">

              <FormControl
                size='md'
                isRequired={true}
                isInvalid={!!formik.errors.n1}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>상점명</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    type='text'
                    placeholder='상점명'
                    onChangeText={formik.handleChange('n1')}
                    onBlur={formik.handleBlur('n1')}
                    value={formik.values?.n1}
                  />
                </Input>
              </FormControl>
              <FormControl
                size='md'
                isRequired={true}
                >
                <FormControlLabel mb="$1">
                  <FormControlLabelText>통화</FormControlLabelText>
                </FormControlLabel>
                <Select onValueChange={onPressCurrency} selectedValue={userStore.currency} selectedLabel={userStore.currency.toUpperCase()}>
                  <SelectTrigger>
                    <SelectInput placeholder="Select option" />
                    <SelectIcon mr="$3">
                      <Icon as={ChevronDownIcon} />
                    </SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent  >
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="KRW" value="krw" defaultValue={true} />
                      <SelectItem label="USD" value="usd" isDisabled={true} />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
              <Button
                isDisabled={formik.values?.n1 === ''}
                onPress={formik.handleSubmit}
                my='$4'>
                <ButtonText>인증</ButtonText>
              </Button>
            </VStack>
          </Box>
        </KeyboardAwareScrollView>
      </Box>
    </SafeAreaView>
  );
});

function MobileHeader() {
  return (
    <VStack px='$3' mt='$4.5' space='md'>
      <VStack space='xs' ml='$1' my='$4'>
        <Heading color='$textLight50' sx={{ _dark: { color: '$textDark50' } }}>
         상점 등록
        </Heading>
        <Text
          fontSize='$md'
          fontWeight='normal'
          color='$primary300'
          sx={{
            _dark: { color: '$textDark400' },
          }}>
          마일리지 및 정산을 위한 상점 등록
        </Text>
      </VStack>
    </VStack>
  );
}

export default ShopReg;
