import NetInfo from '@react-native-community/netinfo';

// Exported connectivity status (default to false until checked)
export let isConnected: boolean = false;

// Function to update the `isConnected` variable
export const updateNetworkStatus = async (): Promise<void> => {
  const state = await NetInfo.fetch();
  isConnected = !!state.isConnected;
};

