import { Route } from "../../../types/strapi";
import communityRoutes from "./community";
import userRoutes from "./user";
import opportunityRoutes from "./opportunity";
import articleRoutes from "./article";

const routes: Route[] = [
  ...communityRoutes,
  ...userRoutes,
  ...opportunityRoutes,
  ...articleRoutes,
];

export default routes;
