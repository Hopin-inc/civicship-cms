import { PrismaClient } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Article } from "../../../types/models";
import CommunityController from "./CommunityController";
import UserController from "./UserController";
import OpportunityController from "./OpportunityController";
import { generateSignedUrl, getFileInfoFromUrl } from "../../../libs/storage";

const prisma = new PrismaClient();

export default class ArticleController {
  static async find(ctx) {
    const { sort } = ctx.query;
    const page = parseInt(ctx.query.page ?? 1);
    const pageSize = parseInt(ctx.query.pageSize ?? 10);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'asc' };
    if (sort) {
      let [field, direction] = sort.split(':');
      orderBy = { [field]: direction.toLowerCase() };
    }

    const [total, items] = await Promise.all([
      prisma.article.count(),
      prisma.article.findMany({
        skip,
        take,
        orderBy,
        include: {
          community: true,
          thumbnail: true,
        },
      }),
    ]);

    const results = await Promise.all(items.map(async (item) => ({
      id: item.id,
      documentId: item.id,
      title: item.title,
      introduction: item.introduction,
      body: item.body,
      category: item.category,
      publishStatus: item.publishStatus,
      thumbnail: item.thumbnail ? {
        id: item.thumbnail.strapiId ?? -1,
        name: item.thumbnail.filename,
        size: item.thumbnail.size,
        width: item.thumbnail.width,
        height: item.thumbnail.height,
        mime: item.thumbnail.mime,
        ext: item.thumbnail.ext,
        alternativeText: item.thumbnail.alt ?? null,
        caption: item.thumbnail.caption ?? null,
        url: item.thumbnail.isPublic
          ? item.thumbnail.url
          : await generateSignedUrl(item.thumbnail.filename, item.thumbnail.folderPath, item.thumbnail.bucket),
        provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
        createdAt: item.thumbnail.createdAt,
      } : null,
      community: {
        ...item.community,
        documentId: item.communityId,
      },
      publishedAtOnDB: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })));

    const pageCount = Math.ceil(total / pageSize);
    ctx.body = {
      results,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount,
        total,
      },
    } satisfies FindControllerResponse<Article>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        community: true,
        thumbnail: true,
      }
    });

    if (!article) {
      return ctx.notFound(`Article not found: ${ id }`);
    }

    ctx.body = {
      data: {
        id: article.id,
        documentId: article.id,
        title: article.title,
        introduction: article.introduction,
        body: article.body,
        category: article.category,
        publishStatus: article.publishStatus,
        community: {
          ...article.community,
          documentId: article.communityId,
        },
        thumbnail: article.thumbnail ? {
          id: article.thumbnail.strapiId ?? -1,
          name: article.thumbnail.filename,
          size: article.thumbnail.size,
          width: article.thumbnail.width,
          height: article.thumbnail.height,
          mime: article.thumbnail.mime,
          ext: article.thumbnail.ext,
          alternativeText: article.thumbnail.alt ?? null,
          caption: article.thumbnail.caption ?? null,
          url: article.thumbnail.isPublic
            ? article.thumbnail.url
            : await generateSignedUrl(article.thumbnail.filename, article.thumbnail.folderPath, article.thumbnail.bucket),
          provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
          createdAt: article.thumbnail.createdAt,
        } : null,
        publishedAtOnDB: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<Article>;
  }

  static async create(ctx) {
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const { title, introduction, body, category, publishStatus, publishedAtOnDB: publishedAt, thumbnail: t } = data;
      const { bucket, folderPath, filename } = getFileInfoFromUrl(t.url);
      // @ts-ignore
      const thumbnail: PrismaJson.ImageInfo | null = t ? {
        strapiId: t.id,
        url: t.url,
        bucket,
        folderPath,
        filename,
        size: t.size,
        width: t.width,
        height: t.height,
        mime: t.mime,
        ext: t.ext,
        alternativeText: t.alt && t.alt !== "" ? t.alt : null,
        caption: t.caption && t.caption !== "" ? t.caption : null,
        provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
        isPublic: true,
        createdAt: t.createdAt,
      } : null;
      const communityId = data.community?.connect[0].id;
      const newArticle = await prisma.article.create({
        data: {
          title,
          introduction,
          body,
          category,
          publishStatus,
          publishedAt,
          thumbnail: {
            create: thumbnail,
          },
          community: {
            connect: {
              id: communityId,
            },
          },
          authors: {
            connect: data.authors?.connect?.map(e => ({ id: e.id })),
          },
          relatedUsers: {
            connect: data.relatedUsers?.connect?.map(e => ({ id: e.id })),
          },
          opportunities: {
            connect: data.opportunities?.connect?.map(e => ({ id: e.id })),
          },
        },
        include: {
          thumbnail: true,
        }
      });
      ctx.body = {
        data: {
          documentId: newArticle.id,
          id: newArticle.id,
          title: newArticle.title,
          introduction: newArticle.introduction,
          body: newArticle.body,
          category: newArticle.category,
          publishStatus: newArticle.publishStatus,
          publishedAtOnDB: newArticle.publishedAt,
          thumbnail: newArticle.thumbnail,
          community: newArticle.communityId,
          createdAt: newArticle.createdAt,
          updatedAt: newArticle.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Create Article Error:", error);
      return ctx.badRequest("Error creating article");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Article not found: ${ id }`);
      }
      const { title, introduction, body, category, publishStatus, publishedAtOnDB: publishedAt, thumbnail: t } = data;
      const { bucket, folderPath, filename } = getFileInfoFromUrl(t.url);
      const updatedArticle = await prisma.article.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(introduction ? { introduction } : {}),
          ...(body ? { body } : {}),
          ...(category ? { category } : {}),
          ...(publishStatus ? { publishStatus } : {}),
          ...(publishedAt ? { publishedAt } : {}),
          ...(t ? {
            thumbnail: {
              create: {
                strapiId: t.id,
                url: t.url,
                bucket,
                folderPath,
                filename,
                size: t.size,
                width: t.width,
                height: t.height,
                mime: t.mime,
                ext: t.ext,
                alt: t.alternativeText && t.alternativeText !== "" ? t.alternativeText : null,
                caption: t.caption && t.caption !== "" ? t.caption : null,
                provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
                isPublic: true,
                createdAt: t.createdAt,
              },
            },
          } : {}),
          ...(data.community?.connect[0] ? {
            community: {
              connect: {
                id: data.community.connect[0].id
              }
            }
          } : {}),
          ...(data.authors ? {
            authors: {
              connect: data.authors.connect?.map(e => ({ id: e.id })),
              disconnect: data.authors.disconnect?.map(e => ({ id: e.id })),
            }
          } : {}),
          ...(data.relatedUsers ? {
            relatedUsers: {
              connect: data.relatedUsers.connect?.map(e => ({ id: e.id })),
              disconnect: data.relatedUsers.disconnect?.map(e => ({ id: e.id })),
            }
          } : {}),
          ...(data.opportunities ? {
            opportunities: {
              connect: data.opportunities.connect?.map(e => ({ id: e.id })),
              disconnect: data.opportunities.disconnect?.map(e => ({ id: e.id })),
            }
          } : {}),
        },
        include: {
          thumbnail: true,
        }
      });
      ctx.body = {
        data: {
          documentId: updatedArticle.id,
          id: updatedArticle.id,
          title: updatedArticle.title,
          introduction: updatedArticle.introduction,
          body: updatedArticle.body,
          category: updatedArticle.category,
          publishStatus: updatedArticle.publishStatus,
          publishedAtOnDB: updatedArticle.publishedAt,
          thumbnail: updatedArticle.thumbnail,
          community: updatedArticle.communityId,
          createdAt: updatedArticle.createdAt,
          updatedAt: updatedArticle.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Update Article Error:", error);
      return ctx.badRequest("Error updating article");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Article not found: ${ id }`);
      }
      await prisma.article.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Article Error:", error);
      return ctx.badRequest("Error deleting article");
    }
  }

  static async findCommunityRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return CommunityController.find(ctx, { articleId: id })
    } else {
      return CommunityController.find(ctx);
    }
  }

  static async findAuthorRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return UserController.find(ctx, { authorArticleId: id })
    } else {
      return UserController.find(ctx);
    }
  }

  static async findRelatedUserRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return UserController.find(ctx, { relatedArticleId: id })
    } else {
      return UserController.find(ctx);
    }
  }

  static async findOpportunitiesRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return OpportunityController.find(ctx, { articleId: id })
    } else {
      return OpportunityController.find(ctx);
    }
  }
};
