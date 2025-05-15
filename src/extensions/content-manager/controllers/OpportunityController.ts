import { Place, Prisma } from '@prisma/client';
import {
  BaseResultNode,
  FindControllerResponse,
  FindOneControllerResponse,
  Image,
  WithRelationObject
} from "../../../types/strapi";
import { Community, Opportunity, User } from "../../../types/models";
import CommunityController from "./CommunityController";
import UserController from "./UserController";
import { ImageDataTransformer } from "../../../utils/transformer";
import PlaceController from "./PlaceController";
import {prismaClient} from "../../../prisma";

type RelationParams = {
  articleId?: string;
  slotId?: string;
};

export default class OpportunityController {
  static async find(ctx, { articleId, slotId }: RelationParams = {}) {
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
    if (slotId) {
      where.slots = {
        some: {
          id: slotId,
        },
      };
    }

    const [total, items] = await Promise.all([
      prismaClient.opportunity.count({ where }),
      prismaClient.opportunity.findMany({
        skip,
        take,
        where,
        include: {
          images: true,
        },
        orderBy,
      }),
    ]);

    const results = await Promise.all(items.map(async (item) => ({
      id: item.id,
      documentId: item.id,
      title: item.title,
      description: item.description,
      body: item.body,
      category: item.category,
      images: await Promise.all(item.images.map(async (image) => await ImageDataTransformer.toStrapi(image))),
      communityId: item.communityId,
      placeId: item.placeId,
      requireApproval: item.requireApproval,
      createdByOnDB: item.createdBy,
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
    } satisfies FindControllerResponse<Opportunity>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const opportunity = await prismaClient.opportunity.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!opportunity) {
      return ctx.notFound(`該当する機会が見つかりませんでした: ${ id }`);
    }

    ctx.body = {
      data: {
        id: opportunity.id,
        documentId: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        body: opportunity.body,
        category: opportunity.category,
        images: await Promise.all(opportunity.images.map(async image => await ImageDataTransformer.toStrapi(image))),
        communityId: opportunity.communityId,
        placeId: opportunity.placeId,
        requireApproval: opportunity.requireApproval,
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
    const data = ctx.request.body as Opportunity
      & WithRelationObject<"images", Image>
      & WithRelationObject<"community", Community>
      & WithRelationObject<"createdByUserOnDB", User>
      & WithRelationObject<"place", Place>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const { title, description, category, body, requireApproval, feeRequired, pointsToEarn } = data;
      const communityId = data.community.connect[0].id;
      const placeId = data.place.connect[0].id;
      const createdBy = data.createdByUserOnDB.connect[0].id;
      const newData = await prismaClient.opportunity.create({
        data: {
          title,
          description,
          category,
          body,
          requireApproval,
          feeRequired,
          pointsToEarn,
          community: {
            connect: {
              id: communityId,
            },
          },
          ...(data.images ? {
            images: {
              create: data.images.map((image) => ImageDataTransformer.fromStrapi(image)),
            }
          } : {}),
          createdByUser: {
            connect: {
              id: createdBy,
            }
          },
          place: {
            connect: {
              id: placeId,
            }
          },
        },
      });
      ctx.body = {
        data: {
          documentId: newData.id,
          id: newData.id,
          title: newData.title,
          description: newData.description,
          body: newData.body,
          category: newData.category,
          requireApproval: newData.requireApproval,
          feeRequired: newData.feeRequired,
          pointsToEarn: newData.pointsToEarn,
          images: [], // This will be fetched separately.
          communityId: newData.communityId,
          placeId: newData.placeId,
          createdByOnDB: newData.createdBy,
          createdAt: newData.createdAt,
          updatedAt: newData.updatedAt,
        } satisfies BaseResultNode & Opportunity,
        meta: {},
      };
    } catch (error) {
      console.error("Create Opportunity Error:", error);
      return ctx.badRequest("データの作成に失敗しました。");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const data = ctx.request.body as Opportunity
      & WithRelationObject<"images", Image>
      & WithRelationObject<"community", Community>
      & WithRelationObject<"createdByUserOnDB", User>
      & WithRelationObject<"place", Place>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const existing = await prismaClient.opportunity.findUnique({ 
        where: { id },
        include: { images: true }
      });
      if (!existing) {
        return ctx.notFound(`該当する機会が見つかりませんでした: ${ id }`);
      }

      const updateData: {
        title?: string;
        description?: string;
        category?: any;
        requireApproval?: boolean;
        feeRequired?: number;
        pointsToEarn?: number;
        body?: string;
        community?: { connect: { id: string } };
        createdByUser?: { connect: { id: string } };
        place?: { connect: { id: string } };
        images?: {
          connect?: { id: string }[];
          create?: any[];
        };
      } = {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.requireApproval !== undefined ? { requireApproval: data.requireApproval } : {}),
        ...(data.feeRequired !== undefined ? { feeRequired: data.feeRequired } : {}),
        ...(data.pointsToEarn !== undefined ? { pointsToEarn: data.pointsToEarn } : {}),
        ...(data.body ? { body: data.body } : {}),
        ...(data.community?.connect?.[0]?.id ? {
          community: {
            connect: {
              id: data.community.connect[0].id
            }
          }
        } : {}),
        ...(data.createdByUserOnDB?.connect?.[0]?.id ? {
          createdByUser: {
            connect: {
              id: data.createdByUserOnDB.connect[0].id
            }
          }
        } : {}),
        ...(data.place?.connect?.[0]?.id ? {
          place: {
            connect: {
              id: data.place.connect[0].id
            }
          }
        } : {})
      };

      try {
        console.log("Existing Images:", existing.images);

        const inputImages = [];

        if (data.images && Array.isArray(data.images)) {
          data.images.forEach(img => {
            if (img && typeof img === 'object' && img.url) {
              inputImages.push(img);
            }
          });
        }

        if (data.images?.connect && Array.isArray(data.images.connect)) {
          data.images.connect.forEach(img => {
            if (img && typeof img === 'object' && img.id) {
              inputImages.push(img);
            }
          });
        }

        console.log("Data Images:", inputImages);

        const uniqueUrlMap = new Map();
        inputImages.forEach(img => {
          if (img.url) {
            uniqueUrlMap.set(img.url, img);
          } else if (img.id) {
            uniqueUrlMap.set(`id:${img.id}`, img);
          }
        });

        const uniqueImages = Array.from(uniqueUrlMap.values());

        const finalConnect = [];
        const finalCreate = [];

        for (const image of uniqueImages) {
          if (typeof image.id === 'number' && image.id !== -1) {
            const found = await prismaClient.image.findUnique({ where: { id: String(image.id) } });
            if (found) {
              finalConnect.push({ id: String(image.id) });
            } else {
              const transformed = ImageDataTransformer.fromStrapi(image);
              finalCreate.push(transformed);
            }
          }
        }

        const imageOperations: {
          disconnect?: { id: string }[];
          connect?: { id: string }[];
          create?: any[];
        } = {};

        if (existing.images && existing.images.length > 0) {
          imageOperations.disconnect = existing.images.map(img => ({
            id: String(img.id)
          }));
        }

        const connectIds = finalConnect.map(c => c.id);
        const validImages = await prismaClient.image.findMany({
          where: { id: { in: connectIds } },
          select: { id: true }
        });
        const validIdSet = new Set(validImages.map(img => img.id));

        const seen = new Set<string>();
        const validConnect = finalConnect.filter(c => {
          if (!validIdSet.has(c.id)) return false;
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });

        if (validConnect.length > 0) {
          imageOperations.connect = validConnect;
        }


        if (finalCreate.length > 0) {
          imageOperations.create = finalCreate;
        }

        if (Object.keys(imageOperations).length > 0) {
          if (imageOperations.connect) {
            console.log("Final connect IDs:", imageOperations.connect.map(img => typeof img.id === 'string' ? 'string:' + img.id : typeof img.id + ':' + img.id));
          }
          updateData.images = imageOperations;
        }

      } catch (imageError) {
        console.error("Error processing images:", imageError);
      }

      const updatedData = await prismaClient.opportunity.update({
        where: { id },
        data: updateData,
      });

      ctx.body = {
        data: {
          documentId: updatedData.id,
          id: updatedData.id,
          title: updatedData.title,
          description: updatedData.description,
          body: updatedData.body,
          category: updatedData.category,
          requireApproval: updatedData.requireApproval,
          feeRequired: updatedData.feeRequired,
          pointsToEarn: updatedData.pointsToEarn,
          images: [], // This will be fetched separately.
          communityId: updatedData.communityId,
          placeId: updatedData.placeId,
          createdByOnDB: updatedData.createdBy,
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt,
        } satisfies BaseResultNode & Opportunity,
        meta: {},
      };
    } catch (error) {
      console.error("Update Opportunity Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prismaClient.opportunity.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する機会が見つかりませんでした: ${ id }`);
      }
      await prismaClient.opportunity.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Opportunity Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
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

  static async findPlaceRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return PlaceController.find(ctx, { opportunityId: id })
    } else {
      return PlaceController.find(ctx);
    }
  }
};
