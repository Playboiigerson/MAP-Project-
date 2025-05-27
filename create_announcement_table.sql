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
  ('Admin', 'Welcome to the Hockey Updates Channel! This is where you''ll find important announcements about games, practices, and events.', true, 5),
  ('Admin', 'Please do rate and leave a review on the app based on your current experience. We rely heavily on your feedback to make improvements!', true, 3);

-- Get the ID of the first announcement to add a reply
DO $$
DECLARE
  first_announcement_id UUID;
BEGIN
  SELECT id INTO first_announcement_id FROM announcements ORDER BY created_at ASC LIMIT 1;
  
  IF first_announcement_id IS NOT NULL THEN
    INSERT INTO announcement_replies (announcement_id, sender_id, sender_name, message, is_admin)
    VALUES
      (first_announcement_id, 'user123', 'John Player', 'Looking forward to using this app!', false);
  END IF;
END
$$; 