import { test as base, expect } from '@playwright/test';

export const selectors = {
  // Header
  header: '.header',
  themeSelect: 'starlight-theme-select select',
  searchButton: 'button[aria-label="Search"]',

  // Search
  searchDialog: 'dialog',
  searchInput: '.pagefind-ui__search-input',
  searchResults: '.pagefind-ui__results',
  searchResult: '.pagefind-ui__result',
  filterContainer: '.topic-filter-container',
  filterButton: '.filter-button',
  activeFilter: '.filter-button.active',

  // Sidebar
  sidebar: '#starlight__sidebar',
  sidebarDetails: '#starlight__sidebar details',
  sidebarSummary: '#starlight__sidebar details > summary',
  sidebarLink: '#starlight__sidebar a[href]',
  currentPage: '#starlight__sidebar [aria-current="page"]',
  productDropdownButton: '#starlight-sidebar-topics-dropdown-button',
  productDropdownMenu: '#starlight-sidebar-topics-dropdown-menu',
  productDropdownItem: '.starlight-sidebar-topics-dropdown-item',

  // Version Picker
  versionPicker: '.version-picker',
  versionSelect: '#version-select',

  // Landing Page
  heroLogo: '.hero-logo',
  cardLink: '.card-link',
  ecosystemLanding: '.ecosystem-landing',
} as const;

export const test = base;
export { expect };
