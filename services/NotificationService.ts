import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  // Register for push notifications
  async registerForPushNotifications() {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Schedule a local notification
  async scheduleLocalNotification(notification: NotificationData, trigger?: Notifications.NotificationTriggerInput) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      },
      trigger: trigger || null,
    });
  }

  // Send immediate notification
  async sendImmediateNotification(notification: NotificationData) {
    return await this.scheduleLocalNotification(notification);
  }

  // Schedule a notification for a match
  async scheduleMatchNotification(matchTitle: string, matchTime: Date, minutesBefore: number = 30) {
    const triggerTime = new Date(matchTime);
    triggerTime.setMinutes(triggerTime.getMinutes() - minutesBefore);

    return await this.scheduleLocalNotification(
      {
        title: 'Match Starting Soon',
        body: `${matchTitle} starts in ${minutesBefore} minutes`,
        data: { type: 'match_reminder', matchTitle, matchTime: matchTime.toISOString() },
      },
      { date: triggerTime }
    );
  }

  // Send goal notification
  async sendGoalNotification(playerName: string, teamName: string) {
    return await this.sendImmediateNotification({
      title: 'Goal Alert!',
      body: `${playerName} scores for ${teamName}!`,
      data: { type: 'goal_alert', player: playerName, team: teamName },
    });
  }

  // Schedule a notification for registration deadline
  async scheduleRegistrationDeadlineNotification(eventTitle: string, deadlineDate: Date, daysBefore: number = 1) {
    const triggerTime = new Date(deadlineDate);
    triggerTime.setDate(triggerTime.getDate() - daysBefore);
    triggerTime.setHours(9, 0, 0); // 9:00 AM

    return await this.scheduleLocalNotification(
      {
        title: 'Registration Deadline Reminder',
        body: `Registration for ${eventTitle} closes ${daysBefore > 1 ? `in ${daysBefore} days` : 'tomorrow'}`,
        data: { type: 'registration_reminder', event: eventTitle, deadline: deadlineDate.toISOString() },
      },
      { date: triggerTime }
    );
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
