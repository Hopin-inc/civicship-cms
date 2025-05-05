import OpportunityController from "../controllers/OpportunityController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const opportunityRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity.opportunity',
    handler: OpportunityController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity.opportunity/:id',
    handler: OpportunityController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:opportunity.opportunity/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:opportunity.opportunity',
    handler: OpportunityController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:opportunity.opportunity/:id',
    handler: OpportunityController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:opportunity.opportunity/:id',
    handler: OpportunityController.delete,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/community',
    handler: OpportunityController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/:id/community',
    handler: OpportunityController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/createdByUserOnDB',
    handler: OpportunityController.findUserRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/:id/createdByUserOnDB',
    handler: OpportunityController.findUserRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/place',
    handler: OpportunityController.findPlaceRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:opportunity.opportunity/:id/place',
    handler: OpportunityController.findPlaceRelations,
  },
];

export default opportunityRoutes;
