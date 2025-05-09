import DeviceInfo from 'react-native-device-info';

async function getLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch(
      'https://api.github.com/repos/hxpe-dev/Tsukiyo/releases/latest',
    );
    const data = await response.json();
    return data.tag_name; // assumes version is stored in tag like "v1.0.0"
  } catch (error) {
    console.warn('Failed to fetch latest version:', error);
    return null;
  }
}

export const checkForUpdate = async (): Promise<boolean> => {
  const currentVersion = DeviceInfo.getVersion(); // e.g., "1.0.0"
  const latestVersion = await getLatestVersion(); // e.g., "v1.1.0"
  if (!latestVersion) {
    return false;
  }

  const cleanLatest = latestVersion.replace(/^v/, '');
  return currentVersion !== cleanLatest;
};
