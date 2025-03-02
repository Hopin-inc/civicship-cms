import { Prisma, PrismaClient } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Opportunity } from "../../../types/models";
import CommunityController from "./CommunityController";
import UserController from "./UserController";

const prisma = new PrismaClient();

type RelationParams = {
  articleId?: string;
};

export default class OpportunityController {
  static async find(ctx, { articleId }: RelationParams = {}) {
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

    const where: Prisma.OpportunityWhereInput = {};
    if (articleId) {
      where.articles = {
        some: {
          id: articleId,
        },
      };
    }

    const [total, items] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({ skip, take, where, orderBy }),
    ]);

    const results = items.map((item) => ({
      id: item.id,
      documentId: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      communityId: item.communityId,
      createdByOnDB: item.createdBy,
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
    } satisfies FindControllerResponse<Opportunity>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const opportunity = await prisma.opportunity.findUnique({ where: { id } });

    if (!opportunity) {
      return ctx.notFound(`Community not found: ${ id }`);
    }

    ctx.body = {
      data: {
        id: opportunity.id,
        documentId: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        category: opportunity.category,
        communityId: opportunity.communityId,
        createdByOnDB: opportunity.createdBy,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<Opportunity>;
  }

  static async create(ctx) {
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const { title, description, category } = data;
      const communityId = data.community.connect[0].id;
      const createdBy = data.createdByOnDB.connect[0].id;
      const newOpportunity = await prisma.opportunity.create({
        data: {
          title,
          description,
          category,
          community: {
            connect: {
              id: communityId,
            },
          },
          createdByUser: {
            connect: {
              id: createdBy,
            }
          },
        },
      });
      ctx.body = {
        data: {
          documentId: newOpportunity.id,
          id: newOpportunity.id,
          title: newOpportunity.title,
          description: newOpportunity.description,
          category: newOpportunity.category,
          communityId: newOpportunity.communityId,
          createdByOnDB: newOpportunity.createdBy,
          createdAt: newOpportunity.createdAt,
          updatedAt: newOpportunity.updatedAt,
        },
        meta: {},
      };
    } catch (error) {
      console.error("Create Opportunity Error:", error);
      return ctx.badRequest("Error creating opportunity");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("No data provided");
    }
    try {
      const existing = await prisma.opportunity.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Opportunity not found: ${ id }`);
      }
      const updatedCommunity = await prisma.opportunity.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.community?.connect[0] ? {
            community: {
              connect: {
                id: data.community.connect[0].id
              }
            }
          } : {}),
          ...(data.createdByOnDB?.connect[0] ? {
            createdByUser: {
              connect: {
                id: data.createdByOnDB.connect[0].id
              }
            }
          } : {}
          ),
        },
      });
      ctx.body = {
        data: {
          documentId: updatedCommunity.id,
          id: updatedCommunity.id,
          title: updatedCommunity.title,
          description: updatedCommunity.description,
          category: updatedCommunity.category,
          communityId: updatedCommunity.communityId,
          createdByOnDB: updatedCommunity.createdBy,
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
      const existing = await prisma.opportunity.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`Opportunity not found: ${ id }`);
      }
      await prisma.opportunity.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Community Error:", error);
      return ctx.badRequest("Error deleting opportunity");
    }
  }

  static async findCommunityRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return CommunityController.find(ctx, { opportunityId: id })
    } else {
      return CommunityController.find(ctx);
    }
  }

  static async findUserRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return UserController.find(ctx, { opportunityId: id })
    } else {
      return UserController.find(ctx);
    }
  }
};
