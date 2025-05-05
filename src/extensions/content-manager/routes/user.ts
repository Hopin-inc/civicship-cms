import UserController from "../controllers/UserController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const userRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:user.user',
    handler: UserController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:user.user/:id',
    handler: UserController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:user.user/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:user.user',
    handler: UserController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:user.user/:id',
    handler: UserController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:user.user/:id',
    handler: UserController.delete,
  },
];

export default userRoutes;
