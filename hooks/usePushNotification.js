import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as RootNavigation from '../utils/root.navigation';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldShowAlert: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userStore) {
  let token;
  try {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus == 'granted') {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas.projectId,
        });

        userStore.setEnableNotification(true);
        userStore.setExpoPushToken(token?.data);
        return finalStatus;
      } else {
        console.log('Failed to get push token for push notificaiton.');
        userStore.setEnableNotification(false);
        userStore.setExpoPushToken('');
        return finalStatus;
      }
    } else {
      console.log('Must be using a physical device for Push Notification.');
      return 'granted';
    }
  } catch (e) {
    alert('usePushNotification e :' + e.message);
  }
}

export const usePushNotification = (userStore, loyaltyStore, pinStore) => {
  // const [expoPushToken, setExpoPushToken] = useState();
  const [notification, setNotification] = useState();

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync(userStore).then((granted) => {
      // setExpoPushToken(token);
    });
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // alert('notification : ' + notification);
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

        // alert(
        //   'notification data :' + JSON.stringify(response.notification.request),
        // );
        if (
          payment.type === 'cancel' ||
          payment.type === 'shop_update' ||
          payment.type === 'shop_status'
        ) {
          loyaltyStore.setPayment(payment);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userStore.permissionsCount]);

  // return { expoPushToken, notification };
};
