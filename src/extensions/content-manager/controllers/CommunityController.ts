import { Prisma, PrismaClient } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Community } from "../../../types/models";

const prisma = new PrismaClient();

type RelationParams = {
  opportunityId?: string;
  articleId?: string;
};

export default class CommunityController {
  static async find(ctx, {
    opportunityId,
    articleId,
  }: RelationParams = {}) {
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

    const where: Prisma.CommunityWhereInput = {};
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

    const [total, items] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({ skip, take, where, orderBy }),
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

    const community = await prisma.community.findUnique({ where: { id } });

    if (!community) {
      return ctx.notFound(`Community not found: ${id}`);
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
      return ctx.badRequest("No data provided");
    }
    try {
      const { name, pointName } = data;
      const newCommunity = await prisma.community.create({
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
      return ctx.badRequest("Error creating community");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const existing = await prisma.community.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Community not found: ${id}`);
      }
      const updatedCommunity = await prisma.community.update({
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
      return ctx.badRequest("Error updating community");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prisma.community.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Community not found: ${id}`);
      }
      await prisma.community.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Community Error:", error);
      return ctx.badRequest("Error deleting community");
    }
  }
};
