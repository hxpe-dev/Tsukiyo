import notifee from '@notifee/react-native';

export async function send(
  title = '',
  body: string = '',
  channelId: string = '',
  smallIcon: string = '',
) {
  await notifee.displayNotification({
    title: title,
    body: body,
    android: {
      channelId,
      smallIcon,
    },
  });
}
