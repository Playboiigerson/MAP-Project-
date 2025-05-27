-- Drop existing tables (replies must be dropped first due to foreign key constraint)
DROP TABLE IF EXISTS announcement_replies;
DROP TABLE IF EXISTS announcements;

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,  -- Changed to UUID to match auth.uid()
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  liked_by_ids UUID[] DEFAULT '{}'::UUID[]  -- Changed to UUID array to match auth.uid()
);

-- Create replies table that references announcements
CREATE TABLE announcement_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,  -- Changed to UUID to match auth.uid()
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on the tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements table
-- Allow anyone to read announcements
CREATE POLICY "Allow public read access" ON announcements 
FOR SELECT USING (true);

-- Allow authenticated users to create announcements
CREATE POLICY "Allow authenticated users to insert" ON announcements 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid()::text = sender_id::text
);

-- Allow users to update their own announcements
CREATE POLICY "Allow users to update own announcements" ON announcements 
FOR UPDATE USING (
  auth.uid()::text = sender_id::text
);

-- Allow users to delete their own announcements
CREATE POLICY "Allow users to delete own announcements" ON announcements 
FOR DELETE USING (
  auth.uid()::text = sender_id::text
);

-- Create policies for announcement replies
-- Allow anyone to read replies
CREATE POLICY "Allow public read access" ON announcement_replies 
FOR SELECT USING (true);

-- Allow authenticated users to create replies
CREATE POLICY "Allow authenticated users to insert replies" ON announcement_replies 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid()::text = sender_id::text
);

-- Allow users to update their own replies
CREATE POLICY "Allow users to update own replies" ON announcement_replies 
FOR UPDATE USING (
  auth.uid()::text = sender_id::text
);

-- Allow users to delete their own replies
CREATE POLICY "Allow users to delete own replies" ON announcement_replies 
FOR DELETE USING (
  auth.uid()::text = sender_id::text
);

-- Insert some initial announcements
INSERT INTO announcements (sender_id, sender_name, message, likes)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'System Admin', 'Welcome to the Hockey Updates Channel! This is where you''ll find important announcements about games, practices, and events.', 5),
  ('00000000-0000-0000-0000-000000000000', 'System Admin', 'Please rate and leave a review on the app based on your experience. Your feedback helps us improve!', 3);
