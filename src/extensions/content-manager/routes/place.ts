import PlaceController from "../controllers/PlaceController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const placeRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:place.place',
    handler: PlaceController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:place.place/:id',
    handler: PlaceController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:place.place/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:place.place',
    handler: PlaceController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:place.place/:id',
    handler: PlaceController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:place.place/:id',
    handler: PlaceController.delete,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:place.place/community',
    handler: PlaceController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:place.place/:id/community',
    handler: PlaceController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:place.place/city',
    handler: PlaceController.findCityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:place.place/:id/city',
    handler: PlaceController.findCityRelations,
  },
];

export default placeRoutes;
