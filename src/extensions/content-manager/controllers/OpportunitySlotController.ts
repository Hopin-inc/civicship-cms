import {
  BaseResultNode,
  FindControllerResponse,
  FindOneControllerResponse,
  WithRelationObject
} from "../../../types/strapi";
import { Opportunity, OpportunitySlot } from "../../../types/models";
import OpportunityController from "./OpportunityController";
import dayjs from "dayjs";
import {prismaClient} from "../../../prisma";

export default class OpportunitySlotController {
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
      prismaClient.opportunitySlot.count(),
      prismaClient.opportunitySlot.findMany({
        skip,
        take,
        orderBy,
        include: {
          opportunity: true,
        },
      }),
    ]);

    const results = await Promise.all(items.map(async (item) => ({
      id: item.id,
      documentId: item.id,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      capacity: item.capacity,
      opportunity: {
        ...item.opportunity,
        createdByOnDB: item.opportunity.createdBy,
        images: [],
        documentId: item.opportunityId,
      },
      opportunityId: item.opportunityId,
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
    } satisfies FindControllerResponse<OpportunitySlot>;
  }

  static async findOne(ctx) {
    const { id } = ctx.params;

    const result = await prismaClient.opportunitySlot.findUnique({
      where: { id },
      include: {
        opportunity: true,
      },
    });

    if (!result) {
      return ctx.notFound(`該当する日程が見つかりませんでした: ${ id }`);
    }

    ctx.body = {
      data: {
        id: result.id,
        documentId: result.id,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        capacity: result.capacity,
        opportunity: {
          ...result.opportunity,
          createdByOnDB: result.opportunity.createdBy,
          images: [],
          documentId: result.opportunityId,
        },
        opportunityId: result.opportunityId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      meta: {
        availableLocales: [],
        availableStatus: [],
      },
    } satisfies FindOneControllerResponse<OpportunitySlot>;
  }

  static async create(ctx) {
    const data = ctx.request.body as OpportunitySlot
      & WithRelationObject<"opportunity", Opportunity>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    const { startsAt, endsAt, capacity } = data;
    if (!dayjs(startsAt).isBefore(dayjs(endsAt))) {
      return ctx.badRequest("開始日時は終了日時よりも前に設定してください。")
    }
    try {
      const opportunityId = data.opportunity?.connect[0].id;
      const newData = await prismaClient.opportunitySlot.create({
        data: {
          startsAt,
          endsAt,
          capacity,
          opportunityId,
        },
      });
      ctx.body = {
        data: {
          documentId: newData.id,
          id: newData.id,
          startsAt: newData.startsAt,
          endsAt: newData.endsAt,
          capacity: newData.capacity,
          opportunityId: newData.opportunityId,
          createdAt: newData.createdAt,
          updatedAt: newData.updatedAt,
        } satisfies BaseResultNode & OpportunitySlot,
        meta: {},
      };
    } catch (error) {
      console.error("Create OpportunitySlot Error:", error);
      return ctx.badRequest("データの登録に失敗しました。");
    }
  }

  static async update(ctx) {
    const { id } = ctx.params;
    const data = ctx.request.body as OpportunitySlot
      & WithRelationObject<"opportunity", Opportunity>;
    if (!data) {
      return ctx.badRequest("データが入力されていません。");
    }
    const { startsAt, endsAt, capacity } = data;
    if (!dayjs(startsAt).isBefore(dayjs(endsAt))) {
      return ctx.badRequest("開始日時は終了日時よりも前に設定してください。")
    }
    try {
      const existing = await prismaClient.opportunitySlot.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する日程が見つかりませんでした: ${ id }`);
      }
      const updatedData = await prismaClient.opportunitySlot.update({
        where: { id },
        data: {
          ...(startsAt ? { startsAt } : {}),
          ...(endsAt ? { endsAt } : {}),
          ...(capacity ? { capacity } : {}),
          ...(data.opportunity?.connect[0] ? {
            opportunity: {
              connect: {
                id: data.opportunity.connect[0].id
              },
            },
          } : {}),
        },
      });
      ctx.body = {
        data: {
          documentId: updatedData.id,
          id: updatedData.id,
          startsAt: updatedData.startsAt,
          endsAt: updatedData.endsAt,
          capacity: updatedData.capacity,
          opportunityId: updatedData.opportunityId,
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt,
        } satisfies BaseResultNode & OpportunitySlot,
        meta: {},
      };
    } catch (error) {
      console.error("Update OpportunitySlot Error:", error);
      return ctx.badRequest("データの更新に失敗しました。");
    }
  }

  static async delete(ctx) {
    const { id } = ctx.params;
    try {
      const existing = await prismaClient.opportunitySlot.findUnique({ where: { id } });
      if (!existing) {
        return ctx.notFound(`該当する日程が見つかりませんでした: ${ id }`);
      }
      await prismaClient.opportunitySlot.delete({ where: { id } });
      ctx.body = {
        data: null,
        meta: {},
      };
    } catch (error) {
      console.error("Delete OpportunitySlot Error:", error);
      return ctx.badRequest("データの削除に失敗しました。");
    }
  }

  static async findOpportunityRelations(ctx) {
    const { id } = ctx.params;
    if (id) {
      return OpportunityController.find(ctx, { slotId: id })
    } else {
      return OpportunityController.find(ctx);
    }
  }
};
