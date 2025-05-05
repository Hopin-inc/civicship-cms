import { Prisma } from '@prisma/client';
import { FindControllerResponse, FindOneControllerResponse } from "../../../types/strapi";
import { City } from "../../../types/models";
import {prismaClient} from "../../../prisma";

type RelationParams = {
  placeId?: string;
};

export default class CityController {
  static async find(ctx, { placeId }: RelationParams = {}) {
    const { sort, _q: q } = ctx.query;
    const page = parseInt(ctx.query.page ?? 1);
    const pageSize = parseInt(ctx.query.pageSize ?? 10);
    const query = q ? decodeURIComponent(q) : undefined;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort) {
      let [field, direction] = sort.split(':');
      orderBy = { [field]: direction.toLowerCase() };
    }

    const where: Prisma.CityWhereInput = {};
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          state: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      ];
    } else if (placeId) {
      where.places = {
        some: {
          id: placeId,
        },
      };
    }
    console.log(where);
    const include: Prisma.CityInclude = {
      state: true,
    };

    const [total, items] = await Promise.all([
      prismaClient.city.count({ where }),
      prismaClient.city.findMany({ skip, take, where, include, orderBy }),
    ]);

    const results = items.map((item) => ({
      id: item.code,
      documentId: item.code,
      name: `${ item.state.name } ${ item.name }`,
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
    } satisfies FindControllerResponse<City>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const city = await prismaClient.city.findUnique({
      where: { code: id },
      include: { state: true },
    });

    if (!city) {
      return ctx.notFound(`City not found: ${ id }`);
    }

    ctx.body = {
      data: {
        id: city.code,
        documentId: city.code,
        name: `${ city.state.name } ${ city.name }`,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<City>;
  }

  static async create(ctx) {
    try {
      console.warn("市区町村を作成することはできません。");
    } catch (error) {
      console.error("Create City Error:", error);
      return ctx.badRequest("データの作成に失敗しました。");
    }
  }

  static async update(ctx) {
    try {
      console.warn("市区町村を編集することはできません。");
    } catch (error) {
      console.error("Update City Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    try {
      console.warn("市区町村を削除することはできません。");
    } catch (error) {
      console.error("Delete City Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
    }
  }
};
