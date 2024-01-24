import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Button,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import DetailsScreen from '../screens/kitchen/Detail';
import Kitchen from '../screens/kitchen/Kitchen';
import SignIn from '../screens/kitchen/SignIn';
import Test from '../screens/kitchen/Test';
import About from '../screens/kitchen/About';
import ActionSheetScreen from '../screens/kitchen/ActionSheet';
import LocalNotification from '../screens/kitchen/LocalNotification';
import BiometricAuthScreen from '../screens/kitchen/BiometricAuthScreen';
import HandelAuthentication from '../screens/kitchen/HandelAuthentication';
import ModalScreen from '../screens/kitchen/ModalScreen';
import PinCodeScreen from '../screens/PinCodeScreen';
import Term from '../screens/initScreens/Term';
import ShopReg from '../screens/initScreens/ShopReg';
import Secret from '../screens/initScreens/Secret';
import { AUTH_STATE } from '../stores/user.store';
import InitPinCodeScreen from '../screens/initScreens/InitPinCodeScreen';
import Temp from '../screens/Temp';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { config } from '../gluestack-style.config.js';
import { useStores, StoreProvider, trunk } from '../stores';

import { observer } from 'mobx-react';
import QRActionSheet from '../screens/QRActionSheet';
import Configuration from '../screens/configuration';
import WalletManager from '../screens/configuration/WalletManager';
import { navigationRef } from '../utils/root.navigation';
import Wallet from '../screens/wallet';
import MileageHistory from '../screens/wallet/MileageHistory';
import MileageRedeemNotification from '../screens/wallet/MileageRedeemNotification';
import 'react-native-url-polyfill/auto';
import { usePushNotification } from '../hooks/usePushNotification';
import Permissions from '../screens/initScreens/Permissions';

const InitStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const routeNameRef = React.createRef();
// Text 적용
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

// TextInput 적용
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

import ko from '../langs/ko.json';

import i18n from 'i18next';
import { useTranslation, initReactI18next } from 'react-i18next';
import ModalActivityIndicator from 'react-native-modal-activityindicator';
import MileageAdjustmentHistory from '../screens/wallet/MileageAdjustmentHistory';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: {
          welcome: 'Welcome to React and react-i18next',
        },
      },
      ko: { translation: ko },
    },
    lng: 'ko', // if you're using a language detector, do not define the lng option
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });
const App = observer(() => {
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);
  const { pinStore, userStore, loyaltyStore } = useStores();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const { expoPushToken } = usePushNotification(userStore, loyaltyStore);
  useEffect(() => {
    const rehydrate = async () => {
      await trunk.init();
      setIsStoreLoaded(true);
      // pinStore.setVisible(false);
      console.log('push token :', expoPushToken);
      if (expoPushToken !== undefined && expoPushToken?.data?.length > 10) {
        userStore.setExpoPushToken(expoPushToken.data);
      }
    };
    rehydrate();
    i18n.changeLanguage(userStore.languageTag);
  }, []);
  let init = false;
  useEffect(() => {
    // 앱 초기 등록 화면이 아니고
    // 핀 코드 화면이 활성 상태 이고
    const initPincode = async () => {
      console.log('userStore.state  :', userStore);
      if (userStore.state === 'DONE' && init === false) {
        init = true;
        pinStore.setNextScreen('Wallet');
        pinStore.setSuccessEnter(false);
        pinStore.setVisible(true);
        pinStore.setUseFooter(false);
        console.log('user state > visible:', pinStore.visible);
      }
    };
    initPincode();
  }, [userStore.state]);

  useEffect(() => {
    const focusEvent = 'change';
    const subscription = AppState.addEventListener(
      focusEvent,
      (nextAppState) => {
        console.log('Before AppState', appState.current);
        const screen = getCurrentRouteName();
        console.log('getCurrentRouteName :', screen);
        if (
          appState.current &&
          appState.current.match(/background/) &&
          nextAppState === 'active'
        ) {
          console.log(
            'App has come to the foreground! > backgroundAt :',
            pinStore.backgrounAt,
          );
          const time = Math.round(+new Date() / 1000);
          console.log('now :', time);

          const diff = time - pinStore.backgrounAt;

          if (userStore.state === 'DONE' && diff > 10) {
            if (pinStore.nextScreen !== 'MileageRedeemNotification')
              pinStore.setNextScreen('Wallet');
            pinStore.setSuccessEnter(false);
            pinStore.setVisible(true);
            pinStore.setUseFooter(false);
          }
        }
        if (
          appState.current &&
          appState.current.match(/active/) &&
          nextAppState === 'background'
        ) {
          console.log('App has come to the background!');

          const time = Math.round(+new Date() / 1000);
          pinStore.setBackgroundAt(time);
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log('After AppState', appState.current);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isStoreLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  } else {
    // userStore.setLoading(false);

    return (
      <BottomSheetModalProvider>
        <NavigationContainer
          independent={true}
          ref={navigationRef}
          onReady={() =>
            (routeNameRef.current =
              navigationRef.current.getCurrentRoute().name)
          }
          onStateChange={() => {
            const previousRouteName = routeNameRef.current;
            const currentRouteName =
              navigationRef.current.getCurrentRoute().name;

            if (previousRouteName !== currentRouteName) {
              // Do something here with it
            }
            console.log('currentRouteName :', currentRouteName);

            // Save the current route name for later comparision
            routeNameRef.current = currentRouteName;
          }}>
          <GluestackUIProvider config={config} colorMode='dark'>
            {userStore.state !== AUTH_STATE.DONE ? (
              <InitStackScreen />
            ) : (
              <MainStackScreen />
            )}

            <QRActionSheet />
          </GluestackUIProvider>
        </NavigationContainer>
        <PinCodeScreen />
        <ModalActivityIndicator
          visible={userStore.loading}
          size='large'
          color='white'
        />
      </BottomSheetModalProvider>
    );
  }
});

function InitStackScreen() {
  return (
    <InitStack.Navigator>
      <InitStack.Screen
        name='Permissions'
        component={Permissions}
        options={{ headerShown: false }}
      />
      <InitStack.Screen
        name='Term'
        component={Term}
        options={{ headerShown: false }}
      />
      <InitStack.Screen
        name='Secret'
        component={Secret}
        options={{ headerShown: false }}
      />
      <InitStack.Screen
        name='InitPinCodeScreen'
        component={InitPinCodeScreen}
        options={{ headerShown: false }}
      />
      <InitStack.Screen
        name='ShopReg'
        component={ShopReg}
        options={{ headerShown: false }}
      />
    </InitStack.Navigator>
  );
}

function MainStackScreen() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name='TabScreens'
        component={TabScreens}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name='Temp'
        component={Temp}
        options={{ headerShown: false }}
      />
      <MainStack.Screen name='WalletManager' component={WalletManager} />
      <MainStack.Screen name='QRActionSheet' component={QRActionSheet} />
      <MainStack.Screen name='MileageHistory' component={MileageHistory} />
      <MainStack.Screen
        name='MileageAdjustmentHistory'
        component={MileageAdjustmentHistory}
      />

      <MainStack.Screen
        name='MileageRedeemNotification'
        component={MileageRedeemNotification}
      />
      <MainStack.Screen
        name='LocalNotification'
        component={LocalNotification}
      />
      <MainStack.Screen name='Detail' component={DetailsScreen} />
      <MainStack.Screen
        name='ActionSheetScreen'
        component={ActionSheetScreen}
      />
      <MainStack.Screen name='About' component={About} />
      <MainStack.Screen name='Test' component={Test} />
      <MainStack.Screen name='SignIn' component={SignIn} />
      <MainStack.Screen name='ModalScreen' component={ModalScreen} />
      <MainStack.Screen
        name='HandelAuthentication'
        component={HandelAuthentication}
      />
      <MainStack.Screen
        name='BiometricAuthScreen'
        component={BiometricAuthScreen}
      />
    </MainStack.Navigator>
  );
}

const TabScreens = observer(() => {
  const { secretStore } = useStores();
  function SearchScreen() {
    return <Text>Search</Text>;
  }

  function NotificationScreen() {
    return <Text>Notification</Text>;
  }

  function MessageScreen({ navigation }) {
    return (
      <View>
        <Button
          title='Go to Details... again'
          onPress={() => navigation.navigate('Detail')}
        />
      </View>
    );
  }
  const handleQRSheet = () => {
    secretStore.setShowQRSheet(!secretStore.showQRSheet);
  };

  return (
    <Tab.Navigator
      initialRouteName='Wallet'
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#171717',
          height: 50,
          marginBottom: 2,
          paddingBottom: 2,
          borderTopWidth: 0,
          borderBottomWidth: 0,
        },
        tabBarItemStyle: {
          backgroundColor: '#171717',
          color: 'white',
          margin: 2,
          borderRadius: 10,
        },
      }}>
      <Tab.Screen
        name='Wallet'
        component={Wallet}
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name='wallet-outline'
              size={focused ? 34 : 24}
              color={focused ? '#4ade80' : 'white'}
            />
          ),
        }}
      />

      <Tab.Screen
        name='Message'
        component={MessageScreen}
        options={{
          title: '메시지',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name='qr-code'
              size={focused ? 34 : 24}
              color={focused ? '#064e3b' : 'white'}
            />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={() => handleQRSheet()} />
          ),
        }}
      />
      <Tab.Screen
        name='Configuration'
        component={Configuration}
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name='ios-settings-outline'
              size={focused ? 34 : 24}
              color={focused ? '#4ade80' : 'white'}
            />
          ),
        }}
      />
      <Tab.Screen
        name='Kitchen'
        component={Kitchen}
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name='kitchen'
              size={focused ? 34 : 24}
              color={focused ? '#4ade80' : 'white'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
});
export function getCurrentRouteName(action) {
  return routeNameRef;
}
export default App;
