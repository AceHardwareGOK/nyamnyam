-- 1. Create recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    source_url TEXT,
    time_minutes INTEGER,
    servings INTEGER,
    calories_100g INTEGER DEFAULT 0,
    protein_100g INTEGER DEFAULT 0,
    fat_100g INTEGER DEFAULT 0,
    carbs_100g INTEGER DEFAULT 0,
    calories_serving INTEGER DEFAULT 0,
    protein_serving INTEGER DEFAULT 0,
    fat_serving INTEGER DEFAULT 0,
    carbs_serving INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create recipe_steps table
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    image_url TEXT,
    timestamp_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Set up Storage
-- In your Supabase dashboard, go to Storage and create a new bucket named 'recipes_media'.
-- Make sure the bucket is public so images can be displayed in the app.
