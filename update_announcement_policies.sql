-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert" ON announcements;
DROP POLICY IF EXISTS "Allow public update" ON announcements;
DROP POLICY IF EXISTS "Allow public delete" ON announcements;

-- Create new policies that allow any authenticated user to create announcements
CREATE POLICY "Allow authenticated users to insert" ON announcements 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only allow users to update their own announcements
CREATE POLICY "Allow users to update own announcements" ON announcements 
FOR UPDATE USING (auth.uid() = sender_id);

-- Only allow users to delete their own announcements
CREATE POLICY "Allow users to delete own announcements" ON announcements 
FOR DELETE USING (auth.uid() = sender_id);

-- Keep the existing read policy as is since it allows public access
-- CREATE POLICY "Allow public read access" ON announcements FOR SELECT USING (true);
