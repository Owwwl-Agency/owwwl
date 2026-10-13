// The site is a static export, so the year is fixed at build time and refreshed by every deploy.
export function CurrentYear() {
  return new Date().getFullYear();
}
