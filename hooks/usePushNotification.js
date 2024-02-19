import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as RootNavigation from '../utils/root.navigation';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const usePushNotification = (userStore, loyaltyStore, pinStore) => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState();
  const [notification, setNotification] = useState();

  const notificationListener = useRef();
  const responseListener = useRef();

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notificaiton.');
        return;
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
    } else {
      console.log('Must be using a physical device for Push Notification.');
      return;
    }
    console.log('t token :', token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    console.log(' after token');
    userStore.setExpoPushToken(token?.data);
    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('response :', response.notification.request.content);
        console.log(
          'response > data :',
          response.notification.request.content.data,
        );
        const data = response.notification.request.content.data;
        const payment = {
          id: data.paymentId,
          type: data.type,
          taskId: data.taskId,
        };

        alert(
          'notification data :' +
            JSON.stringify(response.notification.request.content),
        );
        // loyaltyStore.setPayment(payment);
        if (data.type === 'cancel') {
          pinStore.setNextScreen('MileageRedeemNotification');
          loyaltyStore.setPayment(payment);
          RootNavigation.navigate('MileageRedeemNotification');
        } else if (data.type === 'shop_update' || data.type === 'shop_status') {
          pinStore.setNextScreen('ShopNotification');
          loyaltyStore.setPayment(payment);
          RootNavigation.navigate('ShopNotification');
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userStore.permissionsCount]);

  return { expoPushToken, notification };
};
