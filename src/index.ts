export { default as history } from 'history/browser';

export { createRouter } from './router';
export { createRoute, createMergedRoute } from './route';

export {
  shouldUpdate,
  reduceStore,
  normalizeLocation,
  getQueryParams,
  historyChanger,
  createHistory,
} from './utils';
