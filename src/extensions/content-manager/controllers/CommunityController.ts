import { Prisma } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Community } from "../../../types/models";
import {prismaClient} from "../../../prisma";

type RelationParams = {
  opportunityId?: string;
  articleId?: string;
  placeId?: string;
};

export default class CommunityController {
  static async find(ctx, {
    opportunityId,
    articleId,
    placeId,
  }: RelationParams = {}) {
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

    const where: Prisma.CommunityWhereInput = {};
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          pointName: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }
    if (opportunityId) {
      where.opportunities = {
        some: {
          id: opportunityId,
        },
      };
    }
    if (articleId) {
      where.articles = {
        some: {
          id: articleId,
        },
      };
    }
    if (placeId) {
      where.places = {
        some: {
          id: placeId,
        },
      };
    }

    const [total, items] = await Promise.all([
      prismaClient.community.count({ where }),
      prismaClient.community.findMany({ skip, take, where, orderBy }),
    ]);

    const results = items.map((item) => ({
      id: item.id,
      documentId: item.id,
      name: item.name,
      pointName: item.pointName,
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
    } satisfies FindControllerResponse<Community>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const community = await prismaClient.community.findUnique({ where: { id } });

    if (!community) {
      return ctx.notFound(`該当するコミュニティが見つかりませんでした: ${id}`);
    }

    ctx.body = {
      data: {
        id: community.id,
        documentId: community.id,
        name: community.name,
        pointName: community.pointName,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<Community>;
  }

  static async create(ctx) {
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const { name, pointName } = data;
      const newCommunity = await prismaClient.community.create({
        data: {
          name,
          pointName,
        },
      });
      ctx.body = {
        data: {
          documentId: newCommunity.id,
          id: newCommunity.id,
          name: newCommunity.name,
          bio: newCommunity.bio,
          createdAt: newCommunity.createdAt,
          updatedAt: newCommunity.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Create Community Error:", error);
      return ctx.badRequest("データの作成に失敗しました。");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const existing = await prismaClient.community.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当するコミュニティが見つかりませんでした: ${id}`);
      }
      const updatedCommunity = await prismaClient.community.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.pointName ? { pointName: data.pointName } : {}),
        },
      });
      ctx.body = {
        data: {
          documentId: updatedCommunity.id,
          id: updatedCommunity.id,
          name: updatedCommunity.name,
          pointName: updatedCommunity.pointName,
          createdAt: updatedCommunity.createdAt,
          updatedAt: updatedCommunity.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Update Community Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prismaClient.community.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当するコミュニティが見つかりませんでした: ${id}`);
      }
      await prismaClient.community.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Community Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
    }
  }
};
