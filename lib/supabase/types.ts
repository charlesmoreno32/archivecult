export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  clout_points: number;
  trust_level: number;
  created_at: string;
}

export interface Item {
  id: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  current_clout: number;
  created_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  vote_score: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: string | null;
  is_core: boolean;
}
