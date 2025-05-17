import { Prisma } from '@prisma/client';
import { BaseResultNode, FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { Place } from "../../../types/models";
import CommunityController from "./CommunityController";
import CityController from "./CityController";
import {prismaClient} from "../../../prisma";

type RelationParams = {
  opportunityId?: string;
};

export default class PlaceController {
  static async find(ctx, { opportunityId }: RelationParams = {}) {
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

    const where: Prisma.PlaceWhereInput = {};
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          address: {
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

    const [total, items] = await Promise.all([
      prismaClient.place.count({ where }),
      prismaClient.place.findMany({ skip, take, where, orderBy }),
    ]);

    const results = items.map((item) => ({
      id: item.id,
      documentId: item.id,
      name: item.name,
      displayName: item.name,
      cityCode: item.cityCode,
      address: item.address,
      location: {
        lat: item.latitude.toNumber(),
        lng: item.longitude.toNumber(),
      },
      communityId: item.communityId,
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
    } satisfies FindControllerResponse<Place>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const place = await prismaClient.place.findUnique({ where: { id } });

    if (!place) {
      return ctx.notFound(`該当する拠点が見つかりませんでした: ${ id }`);
    }

    ctx.body = {
      data: {
        id: place.id,
        documentId: place.id,
        name: place.name,
        displayName: place.name,
        cityCode: place.cityCode,
        address: place.address,
        location: {
          lat: place.latitude.toNumber(),
          lng: place.longitude.toNumber(),
        },
        communityId: place.communityId,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<Place>;
  }

  static async create(ctx) {
    const { body: data } = ctx.request;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    try {
      const { name, address, location: { lat: longitude, lng: latitude } } = data;
      const cityCode = data.city.connect[0].id;
      const communityId = data.community.connect[0].id;
      const newPlace = await prismaClient.place.create({
        data: {
          name,
          address,
          longitude,
          latitude,
          cityCode,
          communityId,
          isManual: false,
        },
      });
      ctx.body = {
        data: {
          documentId: newPlace.id,
          id: newPlace.id,
          name: newPlace.name,
          address: newPlace.address,
          location: {
            lat: newPlace.latitude.toNumber(),
            lng: newPlace.longitude.toNumber(),
          },
          cityCode: newPlace.cityCode,
          communityId: newPlace.communityId,
          createdAt: newPlace.createdAt,
          updatedAt: newPlace.updatedAt,
        } satisfies BaseResultNode & Place,
        meta: {},
      };
    } catch (error) {
      console.error("Create Place Error:", error);
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
      const existing = await prismaClient.place.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する拠点が見つかりませんでした: ${ id }`);
      }
      const updatedPlace = await prismaClient.place.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.address ? { address: data.address } : {}),
          ...(data.location.lat ? { latitude: data.location.lat } : {}),
          ...(data.location.lng ? { longitude: data.location.lng } : {}),
          ...(data.city?.connect[0] ? {
            city: {
              connect: {
                code: data.city.connect[0].id,
              },
            },
          } : {}),
          ...(data.community?.connect[0] ? {
            community: {
              connect: {
                id: data.community.connect[0].id,
              },
            },
          } : {}),
        },
      });
      ctx.body = {
        data: {
          documentId: updatedPlace.id,
          id: updatedPlace.id,
          name: updatedPlace.name,
          address: updatedPlace.address,
          location: {
            lat: updatedPlace.latitude.toNumber(),
            lng: updatedPlace.longitude.toNumber(),
          },
          cityCode: updatedPlace.cityCode,
          communityId: updatedPlace.communityId,
          createdAt: updatedPlace.createdAt,
          updatedAt: updatedPlace.updatedAt,
        } satisfies BaseResultNode & Place,
        meta: {},
      };
    } catch (error) {
      console.error("Update Place Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prismaClient.place.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する拠点が見つかりませんでした: ${ id }`);
      }
      await prismaClient.place.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete Place Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
    }
  }

  static async findCommunityRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return CommunityController.find(ctx, { placeId: id })
    } else {
      return CommunityController.find(ctx);
    }
  }

  static async findCityRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return CityController.find(ctx, { placeId: id })
    } else {
      return CityController.find(ctx);
    }
  }
};
