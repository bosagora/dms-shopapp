import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { useStores } from '../../stores';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonText,
  Checkbox,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  EditIcon,
  HStack,
  VStack,
} from '@gluestack-ui/themed';
import { CheckIcon } from 'lucide-react-native';
import MobileHeader from '../../components/MobileHeader';
const Term = observer(({ navigation }) => {
  const { noteStore, userStore } = useStores();
  const [values, setValues] = useState(['T1', 'T2']);
  function agreeTerm() {
    if (values.includes('T1') && values.includes('T2')) {
      navigation.navigate('InitPinCodeScreen');
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
        <MobileHeader title='약관 동의' subTitle='서비스 이용을 위한 약관' />

        <VStack space='lg' pt='$4' m='$7'>
          <CheckboxGroup
            value={values}
            aria-label='rating'
            onChange={(keys) => {
              setValues(keys);
              console.log('keys :', keys);
            }}>
            <VStack space='lg'>
              <Checkbox
                justifyContent='space-between'
                value='T1'
                aria-label='rating1'>
                <HStack justifyContent='space-between' space='lg' w='85%'>
                  <CheckboxLabel>[필수] 서비스 이용약관 동의</CheckboxLabel>
                  <Button
                    borderRadius='$lg'
                    size='xs'
                    px='$1'
                    br='$7'
                    bg='$indigo600'
                    borderColor='$indigo600'>
                    <ButtonText>보기</ButtonText>
                  </Button>
                </HStack>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
              <Checkbox
                value='T2'
                justifyContent='space-between'
                aria-label='rating2'>
                <HStack justifyContent='space-between' space='lg' w='85%'>
                  <CheckboxLabel>
                    [필수] 개인정보 수집 및 이용 동의
                  </CheckboxLabel>
                  <Button
                    borderRadius='$lg'
                    size='xs'
                    px='$1'
                    bg='$indigo600'
                    borderColor='$indigo600'>
                    <ButtonText>보기</ButtonText>
                  </Button>
                </HStack>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
            </VStack>
          </CheckboxGroup>
          <Box py='$10'>
            <Button py='$2.5' px='$3' onPress={() => agreeTerm()}>
              <ButtonText>동의</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </SafeAreaView>
  );
});

export default Term;
