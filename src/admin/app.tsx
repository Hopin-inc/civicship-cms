import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [
      'ja',
    ],
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};
