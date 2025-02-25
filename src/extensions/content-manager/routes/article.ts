import ArticleController from "../controllers/ArticleController";
import UtilsController from "../controllers/UtilsController";
import { Route } from "../../../types/strapi";

const articleRoutes: Route[] = [
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:article.article',
    handler: ArticleController.find,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:article.article/:id',
    handler: ArticleController.findOne,
  },
  {
    method: 'GET',
    path: '/collection-types/api\\:\\:article.article/:id/actions/countDraftRelations',
    handler: UtilsController.countDraftRelations,
  },
  {
    method: 'POST',
    path: '/collection-types/api\\:\\:article.article',
    handler: ArticleController.create,
  },
  {
    method: 'PUT',
    path: '/collection-types/api\\:\\:article.article/:id',
    handler: ArticleController.update,
  },
  {
    method: 'DELETE',
    path: '/collection-types/api\\:\\:article.article/:id',
    handler: ArticleController.delete,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/community',
    handler: ArticleController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/:id/community',
    handler: ArticleController.findCommunityRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/authors',
    handler: ArticleController.findAuthorRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/:id/authors',
    handler: ArticleController.findAuthorRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/relatedUsers',
    handler: ArticleController.findRelatedUserRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/:id/relatedUsers',
    handler: ArticleController.findRelatedUserRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/opportunities',
    handler: ArticleController.findOpportunitiesRelations,
  },
  {
    method: 'GET',
    path: '/relations/api\\:\\:article.article/:id/opportunities',
    handler: ArticleController.findOpportunitiesRelations,
  },
];

export default articleRoutes;
