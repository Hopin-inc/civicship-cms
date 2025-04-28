import { Image as PrismaImage, Prisma } from '@prisma/client';
import { generateSignedUrl, getFileInfoFromUrl } from "../libs/storage";
import { Image as StrapiImage } from "../types/strapi";

export class ImageDataTransformer {
  static async toStrapi(image: PrismaImage): Promise<StrapiImage> {
    return {
      id: image.strapiId ?? -1,
      name: image.filename,
      size: image.size,
      width: image.width,
      height: image.height,
      mime: image.mime,
      ext: image.ext,
      alternativeText: image.alt ?? null,
      caption: image.caption ?? null,
      url: image.isPublic
        ? image.url
        : await generateSignedUrl(image.filename, image.folderPath, image.bucket),
      provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
      createdAt: image.createdAt,
    }
  }

  static fromStrapi(image: StrapiImage): Prisma.ImageCreateInput & Prisma.ImageUpdateInput {
    const { bucket, folderPath, filename } = getFileInfoFromUrl(image.url);
    return {
      strapiId: image.id,
      url: image.url,
      bucket,
      folderPath,
      filename,
      size: image.size,
      width: image.width,
      height: image.height,
      mime: image.mime,
      ext: image.ext,
      alt: image.alternativeText && image.alternativeText !== "" ? image.alternativeText : null,
      caption: image.caption && image.caption !== "" ? image.caption : null,
      isPublic: true,
    }
  }
}
