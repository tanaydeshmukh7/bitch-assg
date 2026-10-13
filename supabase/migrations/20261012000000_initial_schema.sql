-- ====================================================================
-- Assignment Studio - Initial Schema Migration
-- Project: bitch assg
-- Database: Supabase PostgreSQL
-- ====================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile trigger on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    extracted_text TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);

-- 5. Sections table
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    section_type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_project_order ON public.sections(project_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_sections_user_id ON public.sections(user_id);

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Processing Jobs table
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_project_id ON public.processing_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON public.processing_jobs(user_id);

CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON public.processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Exports table
CREATE TABLE IF NOT EXISTS public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    format TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_project_id ON public.exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Projects: CRUD only for project owner
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- Assets: CRUD only for asset owner
CREATE POLICY "Users can view own assets"
    ON public.assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own assets"
    ON public.assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON public.assets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
    ON public.assets FOR DELETE
    USING (auth.uid() = user_id);

-- Sections: CRUD only for section owner
CREATE POLICY "Users can view own sections"
    ON public.sections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sections"
    ON public.sections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sections"
    ON public.sections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sections"
    ON public.sections FOR DELETE
    USING (auth.uid() = user_id);

-- Processing Jobs: CRUD only for owner
CREATE POLICY "Users can view own processing jobs"
    ON public.processing_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing jobs"
    ON public.processing_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing jobs"
    ON public.processing_jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processing jobs"
    ON public.processing_jobs FOR DELETE
    USING (auth.uid() = user_id);

-- Exports: CRUD only for owner
CREATE POLICY "Users can view own exports"
    ON public.exports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
    ON public.exports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
    ON public.exports FOR DELETE
    USING (auth.uid() = user_id);

-- ====================================================================
-- STORAGE BUCKET CONFIGURATION
-- ====================================================================
-- Creates private buckets 'assignment-studio-assets' and 'assignment-studio-exports'
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('assignment-studio-assets', 'assignment-studio-assets', false),
    ('assignment-studio-exports', 'assignment-studio-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Enforce user isolation by storing objects under {user_id}/...
CREATE POLICY "Users can view own storage assets"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN ('assignment-studio-assets', 'assignment-studio-exports')
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own storage assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('assignment-studio-assets', 'assignment-studio-exports')
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own storage assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id IN ('assignment-studio-assets', 'assignment-studio-exports')
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own storage assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id IN ('assignment-studio-assets', 'assignment-studio-exports')
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );
