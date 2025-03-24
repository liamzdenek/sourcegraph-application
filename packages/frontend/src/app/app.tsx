import { StrictMode } from 'react';
import {
  Outlet,
  RouterProvider,
  Router,
  Route,
  RootRoute,
} from '@tanstack/react-router';
import { Layout } from '../components/layout';
import Dashboard from '../components/dashboard/Dashboard';
import RepositoriesList from '../components/repositories/RepositoriesList';
import JobsList from '../components/jobs/JobsList';
import JobDetails from '../components/jobs/JobDetails';
import CreateJob from '../components/jobs/CreateJob';
import RepositoryDetails from '../components/repositories/RepositoryDetails';
import styles from './app.module.css';

// Create routes
const rootRoute = new RootRoute({
  component: Layout,
});

// Dashboard route
const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// Repositories route
const repositoriesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/repositories',
  component: RepositoriesList,
});

// Jobs route
const jobsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs',
  component: JobsList,
});

// Job details route
const jobDetailsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId',
  component: JobDetails,
});

// Create job route
const createJobRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs/create',
  component: CreateJob,
});

// Repository details route
const repositoryDetailsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId/repositories/$repoName',
  component: RepositoryDetails,
});

// Settings route
const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <div className={styles.page}>
      <h1>Settings</h1>
      <p>Settings will be displayed here.</p>
    </div>
  ),
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  repositoriesRoute,
  jobsRoute,
  jobDetailsRoute,
  createJobRoute,
  repositoryDetailsRoute,
  settingsRoute,
]);

// Create the router
const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
