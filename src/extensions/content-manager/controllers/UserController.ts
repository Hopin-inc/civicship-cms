import { Prisma, PrismaClient } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { User } from "../../../types/models";

const prisma = new PrismaClient();

type RelationParams = {
  opportunityId?: string;
  authorArticleId?: string;
  relatedArticleId?: string;
};

export default class UserController {
  static async find(ctx, {
    opportunityId,
    authorArticleId,
    relatedArticleId,
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

    const where: Prisma.UserWhereInput = {};
    if (opportunityId) {
      where.opportunitiesCreatedByMe = {
        some: {
          id: opportunityId,
        },
      };
    }
    if (authorArticleId) {
      where.articlesWrittenByMe = {
        some: {
          id: authorArticleId,
        }
      }
    }
    if (relatedArticleId) {
      where.articlesAboutMe = {
        some: {
          id: relatedArticleId,
        }
      }
    }
    console.log(where);

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ skip, take, where, orderBy }),
    ]);

    const results = items.map((item) => ({
      id: item.id,
      documentId: item.id,
      name: item.name,
      slug: item.slug,
      currentPrefecture: item.currentPrefecture,
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
    } satisfies FindControllerResponse<User>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return ctx.notFound(`User not found: ${ id }`);
    }

    ctx.body = {
      data: {
        id: user.id,
        documentId: user.id,
        name: user.name,
        slug: user.slug,
        currentPrefecture: user.currentPrefecture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<User>;
  }

  static async create(ctx) {
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const { name, slug, currentPrefecture } = data;
      const newUser = await prisma.user.create({
        data: {
          name,
          slug,
          currentPrefecture: currentPrefecture ?? "OUTSIDE_SHIKOKU",
        },
      });
      ctx.body = {
        data: {
          documentId: newUser.id,
          id: newUser.id,
          name: newUser.name,
          slug: newUser.slug,
          currentPrefecture: newUser.currentPrefecture,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Create User Error:", error);
      return ctx.badRequest("Error creating user");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`User not found: ${ id }`);
      }
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.slug ? { slug: data.slug } : {}),
          ...(data.currentPrefecture ? { currentPrefecture: data.currentPrefecture } : {}),
        },
      });
      ctx.body = {
        data: {
          documentId: updatedUser.id,
          id: updatedUser.id,
          name: updatedUser.name,
          slug: updatedUser.slug,
          currentPrefecture: updatedUser.currentPrefecture,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Update User Error:", error);
      return ctx.badRequest("Error updating user");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`User not found: ${ id }`);
      }
      await prisma.user.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete User Error:", error);
      return ctx.badRequest("Error deleting user");
    }
  }
};
