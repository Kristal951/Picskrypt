export interface PictureUser {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
}

export interface Picture {
  id: string;
  imageUrl: string;
  publicId: string | null;
  title: string;
  story: string | null;
  location: string | null;
  tags: string[];
  userId: string;
  width: number;
  height: number;
  blurDataURL?: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  user?: PictureUser | null;
}

export type Photo = Picture;
