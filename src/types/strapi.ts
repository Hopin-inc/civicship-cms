export type Route = {
  method: string;
  path: string;
  handler: unknown;
};

export type BaseResultNode = {
  documentId: string;
  id: string;
};

export type Image = {
  id: number;
  documentId?: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: {
    large?: ImageFormat;
    small?: ImageFormat;
    medium?: ImageFormat;
    thumbnail: ImageFormat;
  };
  hash?: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string | null;
  provider: string;
  provider_metadata?: string | null;
  folderPath?: string;
  createdAt: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  locale?: unknown;
  folder?: string | null;
};

type ImageFormat = {
  ext?: string;
  url: string;
  hash?: string;
  mime?: string;
  name?: string;
  path?: string | null;
  size?: number;
  width?: number;
  height?: number;
  sizeInBytes?: number;
}

type FindOneBaseMeta = {
  availableLocales: unknown[];
  availableStatus: unknown[];
};

export type FindControllerResponse<T> = {
  results: (T & BaseResultNode)[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
};

export type FindOneControllerResponse<T> = {
  data: T & BaseResultNode;
  meta: object & FindOneBaseMeta;
};

export type RelationObject<T> = {
  connect?: (T & Partial<BaseResultNode>)[],
  disconnect?: (T & Partial<BaseResultNode>)[],
}

export type WithRelationObject<K extends string, V> = {
  [key in K]: RelationObject<V>;
};
