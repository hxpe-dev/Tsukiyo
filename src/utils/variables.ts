import NetInfo from '@react-native-community/netinfo';

export let showRestartWarning: boolean = false;

export const setShowRestartWarning = (val: boolean): void => {
  showRestartWarning = val;
};

export let isConnected: boolean = false;

export const updateNetworkStatus = async (): Promise<void> => {
  const state = await NetInfo.fetch();
  isConnected = !!state.isConnected;
};
