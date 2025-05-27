# Supabase Setup for Hockey Manager App

This document provides instructions for setting up the database tables required for the Hockey Manager App in Supabase.

## Creating Announcement Tables

To enable the announcements feature, you need to create two tables in your Supabase project:

1. Log in to your Supabase dashboard: https://app.supabase.com
2. Navigate to the SQL Editor
3. Create a new query and paste the following SQL:

```sql
-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  liked_by_ids TEXT[] DEFAULT '{}'::TEXT[]
);

-- Create replies table that references announcements
CREATE TABLE announcement_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on the tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements table that allow anonymous access
CREATE POLICY "Allow public read access" ON announcements FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON announcements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON announcements FOR DELETE USING (true);

-- Create policies for announcement_replies table that allow anonymous access
CREATE POLICY "Allow public read access" ON announcement_replies FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON announcement_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON announcement_replies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON announcement_replies FOR DELETE USING (true);

-- Insert default announcements
INSERT INTO announcements (sender_name, message, is_admin, likes)
VALUES 
  ('Admin', 'Welcome to Hockey Updates! This is our official announcements channel.', true, 10),
  ('Admin', 'First practice session will be held this Saturday at 10 AM. Don''t forget your gear!', true, 5);

-- Get the ID of the first announcement to add a reply
DO $$
DECLARE
  first_announcement_id UUID;
BEGIN
  SELECT id INTO first_announcement_id FROM announcements ORDER BY created_at ASC LIMIT 1;
  
  IF first_announcement_id IS NOT NULL THEN
    INSERT INTO announcement_replies (announcement_id, sender_id, sender_name, message, is_admin)
    VALUES
      (first_announcement_id, 'user123', 'John Player', 'Looking forward to it!', false);
  END IF;
END
$$;
```

4. Click "Run" to execute the SQL and create the tables

## Setting Supabase Configuration

Make sure your Supabase URL and anon key are correctly set in the `services/supabaseRest.ts` file:

```typescript
const supabaseUrl = 'https://ydfdjhbxaoqzhangllsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZmRqaGJ4YW9xemhhbmdsbHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTA5NTMsImV4cCI6MjA2MjU2Njk1M30.XmgG9DfmCu6ijhmUkSNC4GGQgzNn12lTMylO7Z_cwaQ';
```

## User Announcement Features

The app now includes the following features for announcements:

1. Any logged-in user can create announcements via the "+" button in the header
2. Users can like and reply to announcements
3. Users can delete their own announcements
4. Admin users can delete any announcement
5. All announcements and interactions are synchronized with Supabase

## Automatic Database Initialization

The app now includes an automatic database initialization mechanism that will:

1. Check if there are announcements in the Supabase database
2. If none are found, create default announcements in Supabase
3. This happens automatically when the Announcements screen is loaded

You don't need to manually add test data, as the app will handle this automatically. If you encounter a 400 Bad Request error when interacting with announcements, it's likely because:

1. You're working with mock data rather than real Supabase data
2. The announcement IDs are not properly formatted UUIDs required by Supabase

The fix for this has been implemented in the app via:
- Proper UUID handling in the createAnnouncement service
- Auto-migration of mock data to Supabase when liked or replied to
- Automatic database initialization on app startup

## Testing

After setting up the tables, the app should automatically connect to Supabase for announcements data. If you want to add custom test announcements, you can do it through the SQL Editor with:

```sql
INSERT INTO announcements (sender_id, sender_name, message, is_admin, likes)
VALUES 
  ('admin123', 'Admin', 'Welcome to Hockey Updates! This is our official announcements channel.', true, 10),
  ('admin123', 'Admin', 'First practice session will be held this Saturday at 10 AM. Don''t forget your gear!', true, 5);
```

And add replies with:

```sql
INSERT INTO announcement_replies (announcement_id, sender_id, sender_name, message, is_admin)
VALUES 
  ((SELECT id FROM announcements LIMIT 1), 'user123', 'John Player', 'Looking forward to it!', false);
``` 