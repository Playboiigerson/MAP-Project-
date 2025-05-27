-- Drop all existing tables (in reverse order of creation to handle dependencies)
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS teams;

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  coach TEXT NOT NULL,
  players_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table with the correct structure
CREATE TABLE players (
  id TEXT PRIMARY KEY, -- Using TEXT to match the timestamp-based IDs we create in the app
  name TEXT NOT NULL,
  team_id TEXT NOT NULL, -- Using TEXT to allow storing team name or UUID
  position TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  stats JSONB DEFAULT '{"goals": 0, "assists": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id TEXT PRIMARY KEY, -- Using TEXT to match the timestamp-based IDs we create in the app
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  teams JSONB DEFAULT '[]', -- Store as JSON array instead of TEXT array
  type TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table that allow anonymous access
CREATE POLICY "Allow public read access for teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert for teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for teams" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for teams" ON teams FOR DELETE USING (true);

-- Create policies for players table that allow anonymous access
CREATE POLICY "Allow public read access for players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert for players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for players" ON players FOR DELETE USING (true);

-- Create policies for events table that allow anonymous access
CREATE POLICY "Allow public read access for events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert for events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for events" ON events FOR DELETE USING (true); 