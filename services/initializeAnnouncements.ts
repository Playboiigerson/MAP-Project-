import { announcementService } from './supabaseRest';

/**
 * Initializes the announcements database with default data if it's empty.
 * Should be called when the app starts.
 */
export async function initializeAnnouncementsDatabase(): Promise<void> {
  try {
    // Check if announcements exist
    const announcements = await announcementService.getAnnouncements();
    
    // If we have announcements from Supabase (not mock data), we're done
    if (announcements.length > 0 && announcements[0].id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('Announcements database already initialized');
      return;
    }
    
    console.log('Initializing announcements database with default data');
    
    // Create default announcements
    const announcement1 = await announcementService.createAnnouncement({
      sender_name: 'Admin',
      message: 'Welcome to the Hockey Updates Channel! This is where you\'ll find important announcements about games, practices, and events.',
      is_admin: true,
      likes: 5
    });
    
    await announcementService.createAnnouncement({
      sender_name: 'Admin',
      message: 'Please do rate and leave a review on the app based on your current experience. We rely heavily on your feedback to make improvements!',
      is_admin: true,
      likes: 3
    });
    
    // Add a reply to the first announcement
    if (announcement1) {
      await announcementService.addReply({
        announcement_id: announcement1.id,
        sender_id: 'user123',
        sender_name: 'John Player',
        message: 'Looking forward to using this app!',
        is_admin: false
      });
    }
    
    console.log('Successfully initialized announcements database');
  } catch (error) {
    console.error('Error initializing announcements database:', error);
  }
} 