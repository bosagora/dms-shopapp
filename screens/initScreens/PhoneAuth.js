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

const registerSchema = yup.object().shape({
  n1: yup
    .string()
    .required()
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(2, 'Must be exactly 2 digits')
    .max(2, 'Must be exactly 2 digits'),
  n2: yup
    .string()
    .required()
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(2, 'Must be exactly 2 digits')
    .max(2, 'Must be exactly 2 digits'),
  n3: yup
    .string()
    .required()
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(2, 'Must be exactly 2 digits')
    .max(2, 'Must be exactly 2 digits'),
});

const registerInitialValues = {
  n1: '00',
  n2: '01',
  n3: '02',
};

const PhoneAuth = observer(({ navigation }) => {
  const [client, setClient] = useState(null);
  const [address, setAddress] = useState('');
  const [phoneCode, setPhoneCode] = useState('01010002000');
  const [requestId, setRequestId] = useState('');
  // const [authNum, setAuthNum] = useState('000102');
  const toast = useToast();
  const { userStore } = useStores();

  function secondsToTime(secs) {
    console.log('secs :', secs);
    let hours = Math.floor(secs / (60 * 60));

    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);
    console.log(
      hours,
      divisor_for_minutes,
      minutes,
      divisor_for_seconds,
      seconds,
    );

    let obj = {
      h: hours,
      m: minutes,
      s: seconds,
      ts: secs,
    };
    return obj;
  }
  const [timeLeft, setTimeLeft] = useState({});
  const [validInterval, setValidInterval] = useState();
  let fontRef = useRef(0);
  let intervalRef = useRef(0);
  useEffect(() => {
    async function fetchClient() {
      console.log('PhoneAuth > fetchClient');
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
    userStore.setCurrency(deviceLocales.currencyCode);
    userStore.setLang(deviceLocales.languageCode);
    userStore.setCountry(deviceLocales.regionCode);
    userStore.setLangTag(deviceLocales.languageTag);
    userStore.setCountryPhoneCode(deviceLocales.regionCode == 'KR' ? '82' : '');
  }, []);

  const initiateTimer = () => {
    fontRef.current = 30;
    let timeLeftObj = secondsToTime(fontRef.current);
    setTimeLeft(timeLeftObj);
    console.log('timeLeftObj :', timeLeftObj);
  };

  const startTimer = () => {
    initiateTimer();
    let interval = setInterval(timer, 1000);
    intervalRef.current = interval;
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    fontRef.current = 0;
    intervalRef.current = 0;
    setTimeLeft(secondsToTime(0));
  };

  const timer = () => {
    fontRef.current = fontRef.current - 1;
    console.log('fontRef :', fontRef);
    if (fontRef.current > 0) {
      setTimeLeft(secondsToTime(fontRef.current));
    } else {
      setRequestId('');
      // formik.values = { n1: '', n2: '', n3: '' };
      stopTimer();
      // clearInterval(intervalRef.current);
    }
  };

  async function registerPhone() {
    console.log('userStore :', userStore);
    userStore.setLoading(true);
    const phone = userStore.countryPhoneCode + phoneCode;
    const steps = [];
    try {
      for await (const step of client.link.register(phone)) {
        console.log('register step :', step);
        steps.push(step);
      }
      if (steps.length === 2 && steps[1].key === 'requested') {
        const requestId = steps[1].requestId;
        setRequestId(requestId);
        handleValidTime();
      }
      userStore.setLoading(false);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      userStore.setLoading(false);
      alert('전화번호 등록에 실패하였습니다.' + JSON.stringify(e.message));
    }
  }

  function handleValidTime() {
    startTimer();
  }

  async function submitPhone(authNum) {
    userStore.setLoading(true);
    const steps = [];
    try {
      for await (const step of client.link.submit(requestId, authNum)) {
        steps.push(step);
        console.log('submit step :', step);
      }
      if (steps.length === 2 && steps[1].key === 'accepted') {
        completeAuth();
      }
      userStore.setLoading(false);
    } catch (e) {
      await Clipboard.setStringAsync(JSON.stringify(e));
      console.log('error : ', e);
      userStore.setLoading(false);
      alert('전화번호 인증에 실패하였습니다.' + JSON.stringify(e.message));
    }
  }
  function completeAuth() {
    stopTimer();
    changeUnpayableToPayable().then(() => {
      alert('성공적으로 인증되었습니다.');
      userStore.setPhone(userStore.countryPhoneCode + phoneCode);
      userStore.setAuthState(AUTH_STATE.DONE);
    });
  }
  async function changeUnpayableToPayable() {
    const phone = userStore.countryPhoneCode + phoneCode;
    const balance = await client.ledger.getPointBalance(address);
    console.log('Point balance Before changing :', balance);

    const phoneHash = ContractUtils.getPhoneHash(phone);
    const unpayablePoint =
      await client.ledger.getUnPayablePointBalance(phoneHash);
    console.log('Unpayable point :', unpayablePoint.toString());

    if (unpayablePoint.lte(0)) return;

    for await (const step of client.ledger.changeToPayablePoint(phone)) {
      console.log('change unpayable to payable step :', step);
    }
    const afterBalance = await client.ledger.getPointBalance(address);
    console.log('Point balance After changing :', afterBalance);
  }

  const formik = useFormik({
    initialValues: registerInitialValues,
    validationSchema: registerSchema,

    onSubmit: (values, { resetForm }) => {
      // toast.show({
      //   placement: 'bottom right',
      //   render: ({ id }) => {
      //     return (
      //       <Toast nativeID={id} variant='accent' action='success'>
      //         <ToastTitle>Signed in successfully</ToastTitle>
      //       </Toast>
      //     );
      //   },
      // });

      console.log('form values :', values);
      const authNums = values.n1 + values.n2 + values.n3;
      submitPhone(authNums).then((r) => {
        if (r === true) {
          completeAuth();
        }
      });
      // completeAuth();
      resetForm();
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };
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
            <Text fontWeight='$bold' fontSize='$md'>
              전화번호
            </Text>
            <HStack my='$3' alignItems='center'>
              <Box flex={1}>
                <Input
                  variant='outline'
                  mr='$2'
                  size='md'
                  isDisabled={false}
                  isInvalid={false}
                  isReadOnly={false}>
                  <InputField
                    value={userStore.countryPhoneCode}
                    onChangeText={userStore.setCountryPhoneCode}
                  />
                </Input>
              </Box>
              <Box flex={2}>
                <Input
                  variant='outline'
                  mr='$2'
                  size='md'
                  isDisabled={false}
                  isInvalid={false}
                  isReadOnly={false}>
                  <InputField value={phoneCode} onChangeText={setPhoneCode} />
                </Input>
              </Box>
              <Button
                isDisabled={requestId !== ''}
                onPress={() => {
                  registerPhone();
                }}
                flex={1}>
                <ButtonText>전송</ButtonText>
              </Button>
            </HStack>
            <Text
              fontSize='$sm'
              fontWeight='normal'
              color='$primary300'
              sx={{
                _dark: { color: '$textDark400' },
              }}>
              전화번호 전송 후에 문자 메세지의 인증 코드 3개를 문자에 표시된
              번호(#1, #2, #3)에 맞추어 입력하고 인증을 진행해 주세요.
            </Text>
            <Divider
              my='$6'
              bg='$backgroundLight200'
              sx={{ _dark: { bg: '$backgroundDark700' } }}
            />
            <VStack>
              {fontRef.current > 0 ? (
                <Text
                  fontSize='$sm'
                  fontWeight='normal'
                  color='$primary300'
                  alignSelf='flex-end'
                  mb='$2'
                  sx={{
                    _dark: { color: '$textDark400' },
                  }}>
                  유효시간 {timeLeft.m < 10 ? '0' : ''}
                  {timeLeft.m}:{timeLeft.s < 10 ? '0' : ''}
                  {timeLeft.s}
                </Text>
              ) : null}
              <FormControl
                size='md'
                isRequired={true}
                isInvalid={!!formik.errors.n1}>
                <Input>
                  <InputField
                    type='text'
                    placeholder='#1'
                    onChangeText={formik.handleChange('n1')}
                    onBlur={formik.handleBlur('n1')}
                    value={formik.values?.n1}
                  />
                </Input>
              </FormControl>
              <FormControl
                size='md'
                isRequired={true}
                isInvalid={!!formik.errors.n2}>
                <Input>
                  <InputField
                    placeholder='#2'
                    onChangeText={formik.handleChange('n2')}
                    onBlur={formik.handleBlur('n2')}
                    value={formik.values?.n2}
                  />
                </Input>
              </FormControl>
              <FormControl
                size='md'
                isRequired={true}
                isInvalid={!!formik.errors.n3}>
                {/*<FormControlLabel>*/}
                {/*  <FormControlLabelText>#3</FormControlLabelText>*/}
                {/*</FormControlLabel>*/}
                <Input>
                  <InputField
                    placeholder='#3'
                    onChangeText={formik.handleChange('n3')}
                    onBlur={formik.handleBlur('n3')}
                    value={formik.values?.n3}
                  />
                </Input>
              </FormControl>
              <Button
                isDisabled={requestId === ''}
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
      {/*<HStack space='md' alignItems='center'>*/}
      {/*  <StyledExpoRouterLink href='..'>*/}
      {/*    <Icon*/}
      {/*      as={ArrowLeftIcon}*/}
      {/*      color='$textLight50'*/}
      {/*      sx={{ _dark: { color: '$textDark50' } }}*/}
      {/*    />*/}
      {/*  </StyledExpoRouterLink>*/}
      {/*  <Text*/}
      {/*    color='$textLight50'*/}
      {/*    sx={{ _dark: { color: '$textDark50' } }}*/}
      {/*    fontSize='$lg'>*/}
      {/*    Sign In*/}
      {/*  </Text>*/}
      {/*</HStack>*/}
      <VStack space='xs' ml='$1' my='$4'>
        <Heading color='$textLight50' sx={{ _dark: { color: '$textDark50' } }}>
          전화번호 인증
        </Heading>
        <Text
          fontSize='$md'
          fontWeight='normal'
          color='$primary300'
          sx={{
            _dark: { color: '$textDark400' },
          }}>
          마일리지 사용을 위한 본인 인증
        </Text>
      </VStack>
    </VStack>
  );
}

export default PhoneAuth;
