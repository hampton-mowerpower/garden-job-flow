-- Create table for custom machine data (brands, models, categories)
CREATE TABLE IF NOT EXISTS custom_machine_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('category', 'brand', 'model')),
  category TEXT,
  brand TEXT,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, data_type, category, brand, value)
);

-- Enable RLS
ALTER TABLE custom_machine_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own machine data"
ON custom_machine_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own machine data"
ON custom_machine_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own machine data"
ON custom_machine_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own machine data"
ON custom_machine_data FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_custom_machine_data_user_id ON custom_machine_data(user_id);
CREATE INDEX idx_custom_machine_data_type ON custom_machine_data(data_type);
CREATE INDEX idx_custom_machine_data_category ON custom_machine_data(category);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_machine_data_updated_at
BEFORE UPDATE ON custom_machine_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();