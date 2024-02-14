import * as SecureStore from 'expo-secure-store';

export async function saveSecureValue(key, value) {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureValue(key) {
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    // console.log("🔐 Here's your value 🔐 \n" + result);
    return result;
  } else {
    console.log('No values stored under that key.');
    return null;
  }
}
