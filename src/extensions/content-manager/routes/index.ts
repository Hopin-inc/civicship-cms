import { Route } from "../../../types/strapi";
import communityRoutes from "./community";
import userRoutes from "./user";
import opportunityRoutes from "./opportunity";
import opportunitySlotRoutes from "./opportunity-slot";
import articleRoutes from "./article";
import placeRoutes from "./place";
import cityRoutes from "./city";

const routes: Route[] = [
  ...communityRoutes,
  ...userRoutes,
  ...opportunityRoutes,
  ...opportunitySlotRoutes,
  ...articleRoutes,
  ...placeRoutes,
  ...cityRoutes,
];

export default routes;
