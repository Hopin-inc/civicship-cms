import { BaseResultNode, Image } from "./strapi";

export type Community = {
  name: string;
  pointName: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type User = {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type Opportunity = {
  title: string;
  description: string;
  category: string;
  communityId: string;
  createdByOnDB: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type Article = {
  title: string;
  introduction: string;
  category: string;
  publishStatus: string;
  body: string;
  publishedAtOnDB: Date;
  thumbnail: Image | null;
  community: BaseResultNode & Community;
  createdAt: Date;
  updatedAt?: Date;
};
