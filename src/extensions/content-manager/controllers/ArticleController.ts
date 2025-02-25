import { PrismaClient } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Article } from "../../../types/models";
import CommunityController from "./CommunityController";
import UserController from "./UserController";
import OpportunityController from "./OpportunityController";

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
        },
      }),
    ]);

    const results = items.map((item) => ({
      id: item.id,
      documentId: item.id,
      title: item.title,
      introduction: item.introduction,
      body: item.body,
      category: item.category,
      publishStatus: item.publishStatus,
      thumbnail: null,  // TODO: サムネイル画像を格納する処理を入れる (`civicship-api`も同時改修必要)
      community: {
        ...item.community,
        documentId: item.communityId,
      },
      publishedAtOnDB: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

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
        thumbnail: null,  // TODO: サムネイル画像を格納する処理を入れる (`civicship-api`も同時改修必要)
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
      const { title, introduction, body, category, publishStatus, publishedAtOnDB: publishedAt } = data;
      const communityId = data.community?.connect[0].id;
      const newArticle = await prisma.article.create({
        data: {
          title,
          introduction,
          body,
          category,
          publishStatus,
          publishedAt,
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
      const updatedArticle = await prisma.article.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.introduction ? { introduction: data.introduction } : {}),
          ...(data.body ? { body: data.body } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.publishStatus ? { publishStatus: data.publishStatus } : {}),
          ...(data.publishedAtOnDB ? { publishedAt: data.publishedAtOnDB } : {}),
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
