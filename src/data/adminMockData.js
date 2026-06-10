export const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard', match: ['/admin'] },
  { label: 'Website Content', href: '/admin/cms', icon: 'edit_note', match: ['/admin/cms', '/admin/content'] },
  { label: 'Media Approval', href: '/admin/media', icon: 'verified_user', match: ['/admin/media'] },
  { label: 'Donations', href: '/admin/donations', icon: 'volunteer_activism', match: ['/admin/donations'] },
  { label: 'Sponsorships', href: '/admin/sponsorships', icon: 'child_care', match: ['/admin/sponsorships'] },
  { label: 'Volunteers', href: '/admin/volunteers', icon: 'group', match: ['/admin/volunteers'] },
  { label: 'Events', href: '/admin/cms/events', icon: 'calendar_today', match: ['/admin/events', '/admin/cms/events'] },
];

export const adminNavFooterItems = [
  { label: 'Reports', href: '/admin/reports', icon: 'analytics', match: ['/admin/reports'] },
  { label: 'Settings', href: '/admin/settings', icon: 'settings', match: ['/admin/settings'] },
];

export const adminMobileNavItems = [
  { label: 'Dash', href: '/admin', icon: 'dashboard' },
  { label: 'Content', href: '/admin/cms', icon: 'edit_note' },
  { label: 'Media', href: '/admin/media', icon: 'verified_user' },
  { label: 'People', href: '/admin/volunteers', icon: 'group' },
  { label: 'Events', href: '/admin/cms/events', icon: 'calendar_today' },
];

export const dashboardStats = [
  {
    label: 'Website Visits',
    value: '24,592',
    change: '+12.5%',
    icon: 'trending_up',
    iconClass: 'bg-surface-container-high text-primary',
    sparkline: true,
  },
  {
    label: 'Donations This Month',
    value: '$12,480',
    change: '+8%',
    icon: 'payments',
    iconClass: 'bg-secondary-container text-on-secondary-container',
    progress: 75,
    progressLabel: '75% of monthly goal',
  },
  {
    label: 'Pending Volunteers',
    value: '18',
    icon: 'person_search',
    iconClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    badge: { status: 'warning', label: 'Action Required' },
    note: '4 awaiting interview',
  },
  {
    label: 'Pending Sponsorships',
    value: '34',
    icon: 'diversity_3',
    iconClass: 'bg-surface-container-high text-primary',
    avatars: 3,
    overflow: '+31',
  },
];

export const quickActions = [
  { label: 'Add News Article', icon: 'article', href: '/admin/content' },
  { label: 'Add Event', icon: 'event', href: '/admin/events' },
  { label: 'Upload Resource', icon: 'upload_file', href: '/admin/content' },
  { label: 'Review Applications', icon: 'assignment_ind', href: '/admin/volunteers' },
];

export const recentActivity = [
  {
    icon: 'favorite',
    iconClass: 'bg-secondary-container text-on-secondary-container',
    html: '<span class="font-bold">New donation</span> of $500.00 from <span class="font-semibold text-primary">David Mumba</span> for Clean Water Project.',
    meta: '2 minutes ago • ID: #DN-9042',
  },
  {
    icon: 'person_add',
    iconClass: 'bg-primary-container text-on-primary-container',
    html: '<span class="font-bold">Volunteer application</span> submitted by <span class="font-semibold text-primary">Grace Phiri</span> for Educational Program.',
    meta: '45 minutes ago • Pending Review',
  },
  {
    icon: 'sync',
    iconClass: 'bg-surface-container-high text-primary',
    html: '<span class="font-bold">Website updated</span>: New article "Sustainable Farming in Kafue" published by Administrator.',
    meta: '2 hours ago',
  },
  {
    icon: 'child_friendly',
    iconClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    html: '<span class="font-bold">Sponsorship Renewed</span>: Monthly pledge for Child #C-102 confirmed by recurring payment.',
    meta: '5 hours ago • Auto-processed',
  },
];

export const pendingMedia = [
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbCjI-Y20ouQDjx9lvMAhuT4Nhznlo6_OTStemrLVqJ71UBbnwmqLUEwPH9-3aABk7_SEpBJgsZg4VO88M5dMt08x7kLynuUMcJC3hAgjXRQbrEkaznL7oSrTnq8o0f-94fDJ5Y5ycyXp3P7SNGStcvpa2H2Jlkra88quIaTdnRgU_2M1AAzlln6G-c1fxPsAK6AG0y3CB61XAJ43JESPvjr_gwqbvmZzZ9wckMh6MEoSS8iIz-K4yAcEY4GVQ2wmZRCzzdYaZoDtU',
    alt: 'Community garden',
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAOzhzZkk2D1eLwpVHfTJsy3ZOx5mKjzgytP6zw_pYUSes31VP6rKgKWaK2g3HQQbHdsnJi0senpMZxzDIlbWT_Nrp7SsW5SwFg9wnLEa27CmL7nXvYmWbyhwnvc8jQLElmPvg4697pDDenGCf99OnYxHeg3LVncuCfAsOLoYnSPnxb2IQKHQfsjOMDryawcAR35hLiugCvxqPFzak0mGr6wZVwAgD-r-bmpUHNBGZN_fPy4m8LjB2mtBFAya6mTRUqijycJI8Ji5Jw',
    alt: 'School supplies',
  },
];

export const upcomingEvents = [
  { month: 'Oct', day: '28', title: 'Volunteer Induction', meta: '09:00 AM • Main Hall' },
  { month: 'Nov', day: '02', title: 'Community Feedback Circle', meta: '02:30 PM • Digital Hub' },
  { month: 'Nov', day: '15', title: 'Annual Donor Gala', meta: '06:00 PM • Hyatt Regency' },
];

export const mediaTableColumns = [
  { key: 'item', label: 'Media Item' },
  { key: 'type', label: 'Type & Tags' },
  { key: 'status', label: 'Consent Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

export const mediaTableRows = [
  {
    item: {
      title: 'Classroom_smiles_01.jpg',
      subtitle: 'Uploaded by M. Okoro • 2h ago',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB6C7zLL3DR6BV7121X5cCgfkYB6J3D-twlCaIwFnR4si1wvGdSD0arshBB7YAcw8P1d_yziMnIUhfnGqOIAEial0z3Ov4QNKILG5MgpTZNNXNwJtd-nt3rS4KKixSRGQHiZVn7c-3SFjcyDKLWauUBRng4puxbm3oZ4mcqEshs4DjadGXvwedOIjt9G2jT0vxJRzoQwyP_-EtPc2Gdoze-rULXQwLZqAe0GjPKi6Fmo1QnNrKIIp5-ix1-2lA1t1o53h01FyyXVern',
    },
    type: { icon: 'image', label: 'PHOTO', tone: 'secondary', tags: ['EDUCATION', 'COMMUNITY'] },
    status: { status: 'success', label: 'Consent OK' },
    actions: { approve: true, reject: true },
  },
  {
    item: {
      title: 'Water_Well_Inauguration.mp4',
      subtitle: 'Uploaded by L. Diop • 5h ago',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBYwAldqlZofzGc65u6Ph-MOHHU053qrOWDOOZukDvxjTSBFRgZ6d6VjvczPtQnRizgDqUlf8zFKgMG2rKtIhleqs6-b6LWdjjXNuxYsGlDmjt6PICU4ZOSPo5Mz13vHuw_nJQ1AXPjhdJSPxSN6tZs843FzjHq2in8Urr35u8IyJd2bNqu6IHb_BNq8Of_dlM78bRX9DferdQNWuwk7p7zFmo1bmvMRNry1isORSEYS6RTeHr1gnsy8YHNXozuSqx8b2AfQKE8xFxu',
      video: true,
    },
    type: { icon: 'videocam', label: 'VIDEO', tone: 'tertiary', tags: ['INFRASTRUCTURE', 'HEALTH'] },
    status: { status: 'error', label: 'Missing Consent' },
    actions: { approve: true, reject: true, disabled: true },
  },
  {
    item: {
      title: 'Regional_Impact_Report_2023.pdf',
      subtitle: 'Uploaded by Admin • 1d ago',
      document: true,
    },
    type: { icon: 'article', label: 'DOCUMENT', tone: 'primary', tags: ['ANNUAL REPORT'] },
    status: { status: 'success', label: 'Consent OK' },
    actions: { approve: true, reject: true },
  },
  {
    item: {
      title: 'Clinic_Team_Portrait.jpg',
      subtitle: 'Uploaded by K. Vance • 2d ago',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCuaZeTAJDaMIie09SftaXgPKhGzMuGov9T6hW56bdjU2LabhgHkEUAGgBotbXq6BPvVMmb3sPZyjXuPMfBpvCh3blHwGQtM1wDqm8RBkr_ts9-J0mY5swx7GenPUgozCy6ciq2K8_4-6m7UfKyMC5FUVcApdhtMOA8H0qW9p1n4fmo5na13AYz21OpFR_SSfRs4TR2BqHK2BsVyxx1xFZEPsfR85ab9LFjZfJLe_N6KxN6cGM9a15iU4d9SpuILM2HqP7c26Ij0RRC',
    },
    type: { icon: 'image', label: 'PHOTO', tone: 'secondary', tags: ['HEALTH', 'STAFF'] },
    status: { status: 'success', label: 'Consent OK' },
    actions: { approve: true, reject: true },
  },
];

export const defaultAdminUser = {
  name: 'Sarah Zulu',
  role: 'Project Coordinator',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDNHkCkKubtcYYnhmLr89_zhmEkBx7MADWiXv91TdfE1bhNXtqc5b7cFtRejgvEL1huTkrbz3cTOtMsjcWPoSlPsNaz-A6yfljkxmIX_viamfTKnPOZCNGNClvUnEuUV-bYTrWWo7sOgT3yVEY9gS7a5PLx_shVdlSP1iOHPbNvyTxPw8jV-A4Wt2e5sNp-eXPzDmBhk2cwJTuerxCBEGpJ065-1afirme0RfiNvcFjDVLq0x-8deAR7PAABXcKoZXHIB00DvFZ9rR0',
};

export function isNavActive(currentPath, matchPaths) {
  return matchPaths.some((path) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
  });
}

export default {
  adminNavItems,
  adminNavFooterItems,
  adminMobileNavItems,
  dashboardStats,
  quickActions,
  recentActivity,
  pendingMedia,
  upcomingEvents,
  mediaTableColumns,
  mediaTableRows,
  defaultAdminUser,
  isNavActive,
};
