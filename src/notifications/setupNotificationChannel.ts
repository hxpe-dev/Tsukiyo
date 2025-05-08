import notifee, {AndroidImportance} from '@notifee/react-native';

export async function setupNotificationChannel() {
  await notifee.createChannel({
    id: 'new-chapters',
    name: 'New Chapter Alerts',
    importance: AndroidImportance.HIGH,
  });
}
