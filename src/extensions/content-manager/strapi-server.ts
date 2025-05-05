import customRoutes from './routes';

export default (plugin) => {
  if (plugin.routes['admin']) {
    // カスタムルートを追加
    plugin.routes['admin'].routes = [
      ...customRoutes,
      ...plugin.routes['admin'].routes
    ];
  } else {
    console.log('No admin routes found in content-manager plugin');
  }

  return plugin;
};
