-- Create ambassador_schedule_items table
CREATE TABLE ambassador_schedule_items (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  time_slot TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_ambassador_schedule_day_time ON ambassador_schedule_items(day_of_week, time_slot);