// import * as SecureStore from 'expo-secure-store';

// const TOKEN_KEY = 'auth_token';

// export const saveToken = (token: string) =>
//   SecureStore.setItemAsync(TOKEN_KEY, token);

// export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

// export const deleteToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const saveToken = async (token: string) => {
  if (Platform.OS === 'web') {
    // التخزين العادي للمتصفح
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    // التخزين الآمن للهواتف
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }
};

export const deleteToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};