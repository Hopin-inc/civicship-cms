import OpportunitySlotController from "../controllers/OpportunitySlotController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const opportunitySlotRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot',
    handler: OpportunitySlotController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot/:id',
    handler: OpportunitySlotController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot',
    handler: OpportunitySlotController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot/:id',
    handler: OpportunitySlotController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:opportunity-slot.opportunity-slot/:id',
    handler: OpportunitySlotController.delete,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity-slot.opportunity-slot/opportunity',
    handler: OpportunitySlotController.findOpportunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity-slot.opportunity-slot/:id/opportunity',
    handler: OpportunitySlotController.findOpportunityRelations,
  },
];

export default opportunitySlotRoutes;
