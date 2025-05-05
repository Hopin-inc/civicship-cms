import { BaseResultNode, Image } from "./strapi";
// @ts-ignore
import { ArticleCategory, CurrentPrefecture, OpportunityCategory, PublishStatus } from ".prisma/client";

export type Community = {
  name: string;
  pointName: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type User = {
  name: string;
  slug: string;
  currentPrefecture: CurrentPrefecture;
  createdAt: Date;
  updatedAt?: Date;
};

export type Opportunity = {
  requireApproval: boolean;
  title: string;
  description: string;
  category: OpportunityCategory;
  body: string;
  images: Image[];
  pointsToEarn?: number;
  feeRequired?: number;
  communityId: string;
  community?: BaseResultNode & Community;
  placeId: string;
  place?: BaseResultNode & Place;
  createdByOnDB: string;
  createdByUserOnDB?: BaseResultNode & User;
    createdAt: Date;
  updatedAt?: Date;
};

export type OpportunitySlot = {
  startsAt: Date;
  endsAt: Date;
  capacity?: number;
  opportunityId: string;
  opportunity?: BaseResultNode & Opportunity;
  createdAt: Date;
  updatedAt?: Date;
};

export type Place = {
  name: string;
  address: string;
  cityCode: string;
  city?: BaseResultNode & City;
    location: {
    lat: number;
    lng: number;
  };
  communityId: string;
  community?: BaseResultNode & Community;
  createdAt: Date;
  updatedAt?: Date;
};

export type City = {
  name: string;
};

export type Article = {
  title: string;
  introduction: string;
  category: ArticleCategory;
  publishStatus: PublishStatus;
  body: string;
  publishedAtOnDB: Date;
  thumbnail?: Image | null;
  communityId: string;
  community?: BaseResultNode & Community;
  createdAt: Date;
  updatedAt?: Date;
};
