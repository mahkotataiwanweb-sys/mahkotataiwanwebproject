import { redirect } from 'next/navigation';

// /admin/articles is split into 4 dedicated routes:
//   /admin/events      → type=event
//   /admin/activities  → type=lifestyle
//   /admin/recipes     → type=recipe
//   /admin/news        → type=news
// Redirect any old bookmarks to the Events page.
export default function ArticlesRedirect() {
  redirect('/admin/events');
}
