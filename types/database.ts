export interface Poll {
  id: string;
  title: string;
  question: string;
  created_at: string;
  ends_at: string;
  created_by: string;
  total_votes: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}