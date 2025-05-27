-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  coach TEXT NOT NULL,
  players_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- First drop the players table if it exists
DROP TABLE IF EXISTS players;

-- Create players table with the correct structure to match our code
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  position TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  stats JSONB DEFAULT '{"goals": 0, "assists": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  teams TEXT[],
  type TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table that allow anonymous access
CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON teams FOR DELETE USING (true);

-- Create policies for players table that allow anonymous access
CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON players FOR DELETE USING (true);

-- Create policies for events table that allow anonymous access
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON events FOR DELETE USING (true); 