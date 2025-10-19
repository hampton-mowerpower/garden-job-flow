-- Add final missing table for user preferences

CREATE TABLE IF NOT EXISTS user_table_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  column_order JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Enable RLS
ALTER TABLE user_table_layouts ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own layouts" ON user_table_layouts FOR ALL USING (true);