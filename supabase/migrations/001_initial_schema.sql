-- 001_initial_schema.sql
-- Supabase Migration: Initial Schema for AgriPulse AI
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- farms table
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    soil_type TEXT NOT NULL,
    size_acres NUMERIC(10,2),
    irrigation_system TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- advisories table
CREATE TABLE public.advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    crop_name TEXT NOT NULL,
    growth_stage TEXT NOT NULL,
    symptom_description TEXT NOT NULL,
    image_url TEXT,
    diagnosis_title TEXT NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    severity_level TEXT CHECK (severity_level IN ('Low', 'Moderate', 'High', 'Critical')),
    immediate_actions TEXT[] NOT NULL,
    treatment_plan JSONB NOT NULL,
    preventative_measures TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;

-- RLS policies for farms
CREATE POLICY "Users can view their own farms" ON public.farms
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own farms" ON public.farms
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own farms" ON public.farms
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own farms" ON public.farms
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for advisories
CREATE POLICY "Users can view their own advisories" ON public.advisories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own advisories" ON public.advisories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional seed data (example farms)
INSERT INTO public.farms (user_id, name, location, soil_type, size_acres, irrigation_system)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Green Valley Farm', '45.1234,-93.1234', 'Loam', 120.5, 'Drip'),
    ('00000000-0000-0000-0000-000000000001', 'Sunrise Acres', '44.9876,-92.8765', 'Sandy', 80.0, 'Sprinkler');
