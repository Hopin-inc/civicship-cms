import CityController from "../controllers/CityController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const cityRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:city.city',
    handler: CityController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:city.city/:id',
    handler: CityController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:city.city/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:city.city',
    handler: CityController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:city.city/:id',
    handler: CityController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:city.city/:id',
    handler: CityController.delete,
  }
];

export default cityRoutes;
