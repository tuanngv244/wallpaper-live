-- Create tables for wallpaper-live application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallpapers table
CREATE TABLE IF NOT EXISTS wallpapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist TEXT,
    file_url TEXT NOT NULL,
    duration NUMERIC,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    wallpaper_id UUID REFERENCES wallpapers(id) ON DELETE SET NULL,
    music_url TEXT,
    volume NUMERIC DEFAULT 0.7 CHECK (volume >= 0 AND volume <= 1),
    theme TEXT DEFAULT 'dark',
    auto_play_music BOOLEAN DEFAULT false,
    show_chat BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallpapers_uploader_id ON wallpapers(uploader_id);
CREATE INDEX IF NOT EXISTS idx_wallpapers_created_at ON wallpapers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallpapers_tags ON wallpapers USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_music_tracks_uploader_id ON music_tracks(uploader_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read all profiles, but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallpapers: Public read, authenticated users can upload, owners can delete
CREATE POLICY "Anyone can view wallpapers" ON wallpapers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload wallpapers" ON wallpapers FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own wallpapers" ON wallpapers FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Users can delete own wallpapers" ON wallpapers FOR DELETE USING (auth.uid() = uploader_id);

-- Music tracks: Public read, authenticated users can upload, owners can delete
CREATE POLICY "Anyone can view music tracks" ON music_tracks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload music" ON music_tracks FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own music tracks" ON music_tracks FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Users can delete own music tracks" ON music_tracks FOR DELETE USING (auth.uid() = uploader_id);

-- Messages: Anyone can read, authenticated users can send, users can delete own messages
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

-- User preferences: Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create storage buckets (Run these in Supabase Dashboard -> Storage)
-- Note: These need to be run in the Supabase dashboard or via the JS client

-- Storage policies for wallpapers bucket
-- INSERT: Anyone can upload wallpapers
-- SELECT: Anyone can view wallpapers
-- UPDATE: Users can update their own wallpapers
-- DELETE: Users can delete their own wallpapers

-- Storage policies for music bucket
-- INSERT: Anyone can upload music
-- SELECT: Anyone can view music
-- UPDATE: Users can update their own music
-- DELETE: Users can delete their own music

-- Storage policies for avatars bucket
-- INSERT: Authenticated users can upload avatars
-- SELECT: Anyone can view avatars
-- UPDATE: Users can update their own avatars
-- DELETE: Users can delete their own avatars

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallpapers_updated_at BEFORE UPDATE ON wallpapers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_tracks_updated_at BEFORE UPDATE ON music_tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();