import {
  adminMobileNavItems,
  adminNavFooterItems,
  adminNavItems,
  dashboardStats,
  defaultAdminUser,
  pendingMedia,
  quickActions,
  recentActivity,
  upcomingEvents,
} from '../data/adminMockData.js';

export function attachAdminContext(req, res, next) {
  res.locals.adminNavItems = adminNavItems;
  res.locals.adminNavFooterItems = adminNavFooterItems;
  res.locals.adminMobileNavItems = adminMobileNavItems;
  res.locals.dashboardStats = dashboardStats;
  res.locals.quickActions = quickActions;
  res.locals.recentActivity = recentActivity;
  res.locals.pendingMedia = pendingMedia;
  res.locals.upcomingEvents = upcomingEvents;
  res.locals.adminUser = {
    name: req.user?.email?.split('@')[0] ?? defaultAdminUser.name,
    role: req.user?.role?.replace(/_/g, ' ') ?? defaultAdminUser.role,
    avatar: defaultAdminUser.avatar,
  };
  next();
}

export default attachAdminContext;
