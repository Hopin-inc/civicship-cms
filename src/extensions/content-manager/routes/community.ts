import CommunityController from "../controllers/CommunityController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const communityRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:community.community',
    handler: CommunityController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:community.community/:id',
    handler: CommunityController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:community.community/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:community.community',
    handler: CommunityController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:community.community/:id',
    handler: CommunityController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:community.community/:id',
    handler: CommunityController.delete,
  },
];

export default communityRoutes;
