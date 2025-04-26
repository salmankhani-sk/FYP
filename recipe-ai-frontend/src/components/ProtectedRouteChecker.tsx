// This directive tells Next.js to render this component on the client side.
// It's important because it enables the use of client-side hooks like useEffect, useRouter, and usePathname.
// Use case: Allows the component to dynamically check routes and redirect users on the client side.
"use client";

// Import useRouter and usePathname from Next.js for navigation and route tracking.
// It's important for accessing the current route and programmatically redirecting users.
// Use case: Redirects users to the login page if they attempt to access a protected route without being logged in.
import { useRouter, usePathname } from "next/navigation";

// Import useEffect from React to handle side effects when the component mounts or updates.
// It's important for running the route protection logic after the component renders or the route changes.
// Use case: Checks the user's authentication status and redirects if necessary when the route changes.
import { useEffect } from "react";

// Import Cookies from js-cookie to manage browser cookies.
// It's important for checking the presence of an authentication token in cookies.
// Use case: Determines if the user is logged in by checking for a token in cookies.
import Cookies from "js-cookie";

// Define an array of public routes that don't require authentication.
// It's important for specifying which routes are accessible without logging in.
// Use case: Allows unauthenticated users to access routes like the homepage, login, and register pages.
const publicRoutes: string[] = ["/", "/login", "/register"];

// Define a function to check if the user is logged in by looking for a token in cookies.
// It's important for centralizing the logic to determine the user's authentication status.
// Use case: Used to decide whether to allow access to protected routes or redirect to the login page.
const isLoggedIn = (): boolean => {
    // Return true if a token exists in cookies, false otherwise.
    // It's important for converting the token check into a boolean value.
    // Use case: Provides a simple way to check if a user is authenticated.
    return !!Cookies.get("token");
};

// Define the ProtectedRouteChecker component as a functional component with no props.
// It's important for encapsulating the route protection logic in a reusable component.
// Use case: Ensures that only authenticated users can access protected routes by redirecting unauthenticated users to the login page.
const ProtectedRouteChecker: React.FC = () => {
    // Use useRouter to programmatically navigate to other pages.
    // It's important for redirecting users to the login page if they are not authenticated.
    // Use case: Redirects unauthenticated users attempting to access protected routes.
    const router = useRouter();

    // Use usePathname to get the current route path (e.g., "/recipe-generator", "/login").
    // It's important for determining if the current route is public or protected.
    // Use case: Checks if the current route requires authentication or is publicly accessible.
    const pathname = usePathname();

    // Use useEffect to run the route protection logic when the component mounts or the pathname changes.
    // It's important for ensuring the route check happens after rendering and on route changes.
    // Use case: Automatically redirects users to the login page if they access a protected route without being logged in.
    useEffect(() => {
        // Check if the current path is not a public route and the user is not logged in.
        // It's important for determining if a redirect to the login page is necessary.
        // Use case: Protects routes like "/recipe-generator" by redirecting unauthenticated users to "/login".
        if (!publicRoutes.includes(pathname) && !isLoggedIn()) {
            // Redirect to the login page using router.push.
            // It's important for enforcing authentication requirements on protected routes.
            // Use case: Sends unauthenticated users to the login page to authenticate before accessing protected content.
            router.push("/login");
        }
    }, [pathname, router]); // Dependency array includes pathname and router to re-run the effect on route changes.

    // Return null because this component doesn't render any UI.
    // It's important because this component only handles logic, not rendering.
    // Use case: Acts as a silent guardian for route protection without affecting the visible UI.
    return null;
};

// Export the ProtectedRouteChecker component as the default export.
// It's important for making the component reusable across the app.
// Use case: Allows the component to be imported and used in layouts or pages to enforce route protection.
export default ProtectedRouteChecker;