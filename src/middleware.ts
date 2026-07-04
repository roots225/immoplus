import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes publiques : marketing, auth, webhooks (signature vérifiée dans la route)
// et baromètre public.
const isPublicRoute = createRouteMatcher([
  "/",
  "/fonctionnalites(.*)",
  "/tarifs(.*)",
  "/barometre(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/barometre(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Ignore les fichiers statiques et _next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
