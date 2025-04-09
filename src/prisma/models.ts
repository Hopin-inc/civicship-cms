// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    export type ImageInfo = {
      strapiId?: number;
      bucket: string;
      folderPath: string;
      fileName: string;
      url: string;
      isPublic: boolean;
      size: number;
      width: number;
      height: number;
      ext: string;
      mime: string;
      createdAt: Date;
      updatedAt?: Date;
      caption?: string;
      alt?: string;
    };
    export type ArrayOfIds = string[];
    export type ArrayOfImageInfo = ImageInfo[];
  }
}
