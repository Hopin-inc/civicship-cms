import { Prisma } from '@prisma/client';
import {
  BaseResultNode,
  FindControllerResponse,
  FindOneControllerResponse,
  WithRelationObject
} from "../../../types/strapi";
import { Article, Community, Opportunity, User } from "../../../types/models";
import CommunityController from "./CommunityController";
import UserController from "./UserController";
import OpportunityController from "./OpportunityController";
import { ImageDataTransformer } from "../../../utils/transformer";
import {prismaClient} from "../../../prisma";

export default class ArticleController {
  static async find(ctx) {
    const { sort, _q: q } = ctx.query;
    const page = parseInt(ctx.query.page ?? 1);
    const pageSize = parseInt(ctx.query.pageSize ?? 10);
    const query = q ? decodeURIComponent(q) : undefined;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'asc' };
    if (sort) {
      let [field, direction] = sort.split(':');
      orderBy = { [field]: direction.toLowerCase() };
    }

    const where: Prisma.ArticleWhereInput = {};
    if (query) {
      where.OR = [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          introduction: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          body: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      prismaClient.article.count({ where }),
      prismaClient.article.findMany({
        skip,
        take,
        where,
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
      thumbnail: item.thumbnail ? await ImageDataTransformer.toStrapi(item.thumbnail) : null,
      communityId: item.communityId,
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

    const article = await prismaClient.article.findUnique({
      where: { id },
      include: {
        community: true,
        thumbnail: true,
      }
    });

    if (!article) {
      return ctx.notFound(`該当する記事が見つかりませんでした: ${ id }`);
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
        communityId: article.communityId,
        thumbnail: article.thumbnail ? await ImageDataTransformer.toStrapi(article.thumbnail) : null,
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
    const data = ctx.request.body as Article
      & WithRelationObject<"community", Community>
      & WithRelationObject<"authors", User>
      & WithRelationObject<"relatedUsers", User>
      & WithRelationObject<"opportunities", Opportunity>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const { title, introduction, body, category, publishStatus, publishedAtOnDB: publishedAt, thumbnail: t } = data;
      const thumbnail = t ? {
        create: ImageDataTransformer.fromStrapi(t),
      } : undefined;
      const communityId = data.community?.connect[0].id;
      const newData = await prismaClient.article.create({
        data: {
          title,
          introduction,
          body,
          category,
          publishStatus,
          publishedAt,
          thumbnail,
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
          documentId: newData.id,
          id: newData.id,
          title: newData.title,
          introduction: newData.introduction,
          body: newData.body,
          category: newData.category,
          publishStatus: newData.publishStatus,
          publishedAtOnDB: newData.publishedAt,
          thumbnail: await ImageDataTransformer.toStrapi(newData.thumbnail),
          communityId: newData.communityId,
          createdAt: newData.createdAt,
          updatedAt: newData.updatedAt,
        } satisfies BaseResultNode & Article,
        meta: {},
      };
    } catch (error) {
      console.error("Create Article Error:", error);
      return ctx.badRequest("データの作成に失敗しました。");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const data = ctx.request.body as Article
      & WithRelationObject<"community", Community>
      & WithRelationObject<"authors", User>
      & WithRelationObject<"relatedUsers", User>
      & WithRelationObject<"opportunities", Opportunity>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const existing = await prismaClient.article.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する記事が見つかりませんでした: ${ id }`);
      }
      const { title, introduction, body, category, publishStatus, publishedAtOnDB: publishedAt, thumbnail: t } = data;
      const updatedData = await prismaClient.article.update({
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
              create: ImageDataTransformer.fromStrapi(t),
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
          documentId: updatedData.id,
          id: updatedData.id,
          title: updatedData.title,
          introduction: updatedData.introduction,
          body: updatedData.body,
          category: updatedData.category,
          publishStatus: updatedData.publishStatus,
          publishedAtOnDB: updatedData.publishedAt,
          thumbnail: await ImageDataTransformer.toStrapi(updatedData.thumbnail),
          communityId: updatedData.communityId,
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt,
        } satisfies BaseResultNode & Article,
        meta: {},
      };
    } catch (error) {
      console.error("Update Article Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prismaClient.article.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する記事が見つかりませんでした: ${ id }`);
      }
      await prismaClient.article.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Article Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
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
