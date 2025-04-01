/*
  # Create Polling System Tables

  1. New Tables
    - `polls`: Stores poll information
      - `id` (uuid, primary key)
      - `title` (text)
      - `question` (text)
      - `created_at` (timestamp)
      - `ends_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `total_votes` (integer)

    - `poll_options`: Stores options for each poll
      - `id` (uuid, primary key)
      - `poll_id` (uuid, references polls)
      - `text` (text)
      - `votes` (integer)

    - `votes`: Stores user votes
      - `id` (uuid, primary key)
      - `poll_id` (uuid, references polls)
      - `option_id` (uuid, references poll_options)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for reading and voting
    - Prevent multiple votes from same user

  3. Functions
    - Add function to update vote counts
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  question text NOT NULL,
  created_at timestamptz DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  total_votes integer DEFAULT 0
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  votes integer DEFAULT 0
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON polls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policies for poll options
CREATE POLICY "Anyone can view poll options"
  ON poll_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create poll options"
  ON poll_options FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM polls
    WHERE id = poll_options.poll_id
    AND created_by = auth.uid()
  ));

-- Policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM votes
      WHERE poll_id = votes.poll_id
      AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE id = votes.poll_id
      AND ends_at > now()
    )
  );

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update the votes count for the option
    UPDATE poll_options
    SET votes = votes + 1
    WHERE id = NEW.option_id;
    
    -- Update the total votes for the poll
    UPDATE polls
    SET total_votes = total_votes + 1
    WHERE id = NEW.poll_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote counts
CREATE TRIGGER vote_counts_trigger
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_counts();