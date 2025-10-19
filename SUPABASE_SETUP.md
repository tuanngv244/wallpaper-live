# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the project to be ready

## 2. Database Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create all tables, indexes, RLS policies, and triggers

## 3. Storage Setup

### Create Buckets

Go to Storage in your Supabase dashboard and create these buckets:

1. **wallpapers** (public bucket)
2. **music** (public bucket)
3. **avatars** (public bucket)

### Configure Storage Policies

For each bucket, add these policies:

#### Wallpapers Bucket

```sql
-- Allow anyone to view wallpapers
CREATE POLICY "Anyone can view wallpapers" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');

-- Allow authenticated users to upload wallpapers
CREATE POLICY "Authenticated users can upload wallpapers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wallpapers' AND auth.role() = 'authenticated');

-- Allow users to update their own wallpapers
CREATE POLICY "Users can update own wallpapers" ON storage.objects FOR UPDATE USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own wallpapers
CREATE POLICY "Users can delete own wallpapers" ON storage.objects FOR DELETE USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Music Bucket

```sql
-- Allow anyone to view music
CREATE POLICY "Anyone can view music" ON storage.objects FOR SELECT USING (bucket_id = 'music');

-- Allow authenticated users to upload music
CREATE POLICY "Authenticated users can upload music" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music' AND auth.role() = 'authenticated');

-- Allow users to update their own music
CREATE POLICY "Users can update own music" ON storage.objects FOR UPDATE USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own music
CREATE POLICY "Users can delete own music" ON storage.objects FOR DELETE USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Avatars Bucket

```sql
-- Allow anyone to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase project URL and anon key:
   - Find these in Settings -> API in your Supabase dashboard
   - `VITE_SUPABASE_URL`: Your project URL
   - `VITE_SUPABASE_ANON_KEY`: Your anon/public key

## 5. Authentication Settings

Go to Authentication -> Settings in your Supabase dashboard:

1. **Site URL**: Add your local development URL (e.g., `http://localhost:5173`)
2. **Redirect URLs**: Add your production URL when deploying
3. **Email Auth**: Enable if you want email/password authentication
4. **Anonymous Sign-ins**: Enable for guest users

## 6. Realtime Settings

Go to Database -> Replication in your Supabase dashboard:

1. Enable realtime for the `messages` table
2. This allows real-time chat functionality

## 7. Test the Setup

1. Run `npm run dev`
2. Visit `http://localhost:5173`
3. Try signing up/in and uploading content to test the integration

## Database Schema Overview

### Tables Created:

- `users` - User profiles and authentication
- `wallpapers` - Uploaded wallpaper files and metadata
- `music_tracks` - Uploaded music files and metadata
- `messages` - Chat messages with real-time sync
- `user_preferences` - User settings and preferences

### Features Enabled:

- Row Level Security (RLS) for data protection
- Real-time subscriptions for chat
- File storage with proper access controls
- Automatic timestamp updates
- Optimized indexes for performance
