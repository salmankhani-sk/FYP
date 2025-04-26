// This directive tells Next.js to render this component on the client side.
// It's important because it enables client-side features like React hooks (useState, useEffect) and navigation hooks (usePathname, useRouter).
// Use case: Ensures the Navbar can dynamically update based on the current route and user authentication state.
"use client";

// Import the Link component from Next.js for client-side navigation.
// It's important for providing smooth navigation without full page reloads, improving user experience.
// Use case: Used for navigation links like "Home," "Recipe Generator," and "Login."
import Link from "next/link";

// Import usePathname and useRouter from Next.js for accessing the current route and programmatically navigating.
// It's important for determining the active route and redirecting users (e.g., after logout).
// Use case: Highlights the active navigation link and redirects to the homepage on logout.
import { usePathname, useRouter } from "next/navigation";

// Import useState and useEffect from React for managing component state and side effects.
// It's important for handling dynamic UI updates like toggling the mobile menu and fetching user data on mount.
// Use case: Manages the username display and mobile menu visibility.
import { useState, useEffect } from "react";

// Import jwtDecode to decode JWT tokens for extracting user information.
// It's important for accessing the username stored in the token's payload.
// Use case: Retrieves the username from the token to display in the Navbar.
import { jwtDecode } from "jwt-decode";

// Import Cookies from js-cookie to manage browser cookies.
// It's important for reading and removing the authentication token stored in cookies.
// Use case: Checks for a token to determine if a user is logged in and removes it on logout.
import Cookies from "js-cookie";

// Import specific icons from react-icons (Font Awesome) for visual representation.
// It's important for adding intuitive, food-themed icons to navigation links.
// Use case: Enhances the UI by pairing icons like a home or utensils with navigation labels.
import { FaHome, FaUtensils, FaUpload, FaAppleAlt, FaShoppingCart } from "react-icons/fa";

// Define an interface for the decoded JWT token to ensure TypeScript type safety.
// It's important for specifying the expected structure of the decoded token.
// Use case: Ensures the token's "sub" field (username) is typed correctly when decoded.
interface DecodedToken {
    sub?: string;
}

// Define the Navbar functional component, which serves as the navigation bar for the app.
// It's important because it provides consistent navigation across all pages.
// Use case: Allows users to access different sections of the app (e.g., Home, Recipe Generator) and manage authentication.
const Navbar: React.FC = () => {
    // Use usePathname to get the current route path (e.g., "/", "/recipe-generator").
    // It's important for determining which navigation link should be highlighted as active.
    // Use case: Highlights the current page in the Navbar with a different color (yellow).
    const pathname = usePathname();

    // Use useRouter to programmatically navigate to other pages.
    // It's important for redirecting users, such as after logging out.
    // Use case: Redirects to the homepage when the user logs out.
    const router = useRouter();

    // Use useState to manage the username state, initially set to an empty string.
    // It's important for dynamically displaying the logged-in user's username or nothing if not logged in.
    // Use case: Shows the username in the Navbar when a user is authenticated.
    const [username, setUsername] = useState<string>("");

    // Use useState to manage the mobile menu's open/closed state, initially set to false (closed).
    // It's important for toggling the visibility of the mobile menu on smaller screens.
    // Use case: Shows or hides the dropdown menu when the hamburger icon is clicked on mobile.
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    // Use useEffect to run side effects when the component mounts or the pathname changes.
    // It's important for checking the authentication token and updating the username state accordingly.
    // Use case: Automatically updates the Navbar to reflect the user's login status on page navigation.
    useEffect(() => {
        // Retrieve the token from cookies using Cookies.get.
        // It's important for checking if a user is authenticated by looking for a stored token.
        // Use case: Determines whether to show authenticated routes or login/register links.
        const token = Cookies.get("token");

        // Check if a token exists.
        // It's important for deciding how to handle the authentication state.
        // Use case: Proceeds to decode the token if it exists, otherwise clears the username.
        if (token) {
            try {
                // Decode the token using jwtDecode to extract the username (stored in the "sub" field).
                // It's important for accessing user information encoded in the token.
                // Use case: Retrieves the username to display in the Navbar.
                const decodedToken: DecodedToken = jwtDecode<{ sub?: string }>(token);

                // Check if the decoded token has a "sub" field (username).
                // It's important for ensuring the token contains the expected data.
                // Use case: Sets the username state if the "sub" field exists.
                if (decodedToken.sub) {
                    setUsername(decodedToken.sub);
                }
            } catch (error) {
                // Log an error if token decoding fails (e.g., invalid token).
                // It's important for debugging and handling authentication failures gracefully.
                // Use case: Alerts developers to token issues during development.
                console.error("Invalid token:", error);

                // Clear the username state if the token is invalid.
                // It's important for ensuring the UI reflects the correct authentication state.
                // Use case: Prevents showing a username when the token is invalid.
                setUsername("");
            }
        } else {
            // Clear the username state if no token is found.
            // It's important for reflecting that no user is logged in.
            // Use case: Hides authenticated routes and shows login/register links.
            setUsername("");
        }
    }, [pathname]); // Dependency array includes pathname to re-run the effect on route changes.

    // Define a function to handle logout actions.
    // It's important for providing a way for users to sign out of the app.
    // Use case: Removes the token, clears the username, and redirects to the homepage on logout.
    const handleLogout = () => {
        // Remove the token from cookies using Cookies.remove.
        // It's important for clearing the authentication state in the browser.
        // Use case: Logs the user out by removing their session token.
        Cookies.remove("token");

        // Clear the username state to reflect the logged-out state.
        // It's important for updating the UI to show the user is no longer authenticated.
        // Use case: Hides the username and authenticated routes after logout.
        setUsername("");

        // Close the mobile menu if it's open.
        // It's important for ensuring a clean UI state after logout on mobile.
        // Use case: Prevents the mobile menu from staying open after redirection.
        setIsMenuOpen(false);

        // Redirect the user to the homepage using router.push.
        // It's important for bringing the user back to a neutral starting point after logout.
        // Use case: Navigates to the root route ("/") after logout.
        router.push("/");
    };

    // Define a function to toggle the mobile menu's visibility.
    // It's important for controlling the mobile menu's open/closed state.
    // Use case: Allows users to show or hide the navigation links on mobile devices.
    const toggleMenu = () => {
        // Toggle the isMenuOpen state by negating its current value.
        // It's important for switching between showing and hiding the mobile menu.
        // Use case: Opens the menu when closed, and closes it when open, on hamburger click.
        setIsMenuOpen(!isMenuOpen);
    };

    // Return the JSX structure that defines the Navbar layout and content.
    // It's important for rendering the navigation UI that users interact with.
    // Use case: Provides navigation links, authentication status, and a mobile menu.
    return (
        // Navbar wrapper with a gradient background and shadow for visual appeal.
        // It's important for creating a distinct, professional navigation bar.
        // Use case: Styles the Navbar with a blue-to-purple gradient and adds depth with a shadow.
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
            {/* Container to center and constrain the Navbar content with a max width.
               It's important for ensuring consistent layout across screen sizes.
               Use case: Aligns the Navbar elements (logo, links, buttons) in a responsive manner. */}
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left Section: Project name/logo as a clickable link.
                   It's important for providing a consistent way to return to the homepage.
                   Use case: Allows users to navigate back to the root route ("/") from any page. */}
                <div className="text-white font-bold text-xl">
                    {/* Link to the homepage with the project name as text.
                       It's important for branding and navigation.
                       Use case: Displays "Food Recipe AI" and links to the homepage. */}
                    <Link href="/">Food Recipe AI</Link>
                </div>

                {/* Hamburger Menu Button: Visible only on mobile screens (hidden on medium and larger).
                   It's important for providing a mobile-friendly way to access navigation links.
                   Use case: Toggles the mobile menu when clicked on smaller screens. */}
                <button className="md:hidden text-white focus:outline-none" onClick={toggleMenu}>
                    {/* SVG icon for the hamburger menu (or close icon when menu is open).
                       It's important for visually indicating the menu toggle action.
                       Use case: Displays three lines when closed, or an "X" when the menu is open. */}
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Path element to draw the hamburger or close icon dynamically.
                           It's important for switching between the two states based on isMenuOpen.
                           Use case: Shows a hamburger icon (three lines) or a close icon (X) based on menu state. */}
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        />
                    </svg>
                </button>

                {/* Center Section: Navigation routes for desktop screens (hidden on mobile).
                   It's important for displaying main navigation links when the user is logged in or out.
                   Use case: Shows different links based on authentication status (e.g., more links when logged in). */}
                {username ? (
                    // Display authenticated routes if a username exists (user is logged in).
                    // It's important for providing access to app features for authenticated users.
                    // Use case: Shows links like Recipe Generator, Upload Images, etc., for logged-in users.
                    <div className="hidden md:flex space-x-6 items-center">
                        {/* Home link with icon, highlighted if the current path is "/".
                           It's important for navigation and visual feedback on the active route.
                           Use case: Navigates to the homepage and highlights the link when active. */}
                        <Link href="/" className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaHome className="mr-2" /> Home
                        </Link>
                        {/* Recipe Generator link with icon, highlighted if the current path matches.
                           It's important for accessing the recipe generation feature.
                           Use case: Navigates to the recipe generator page and highlights when active. */}
                        <Link href="/recipe-generator" className={`${pathname === "/recipe-generator" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaUtensils className="mr-2" /> Recipe Generator
                        </Link>
                        {/* Upload Images link with icon, highlighted if the current path matches.
                           It's important for accessing the image upload feature.
                           Use case: Navigates to the uploads page and highlights when active. */}
                        <Link href="/uploads" className={`${pathname === "/uploads" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaUpload className="mr-2" /> Upload Images
                        </Link>
                        {/* Nutrition Info link with icon, highlighted if the current path matches.
                           It's important for accessing the nutrition analysis feature.
                           Use case: Navigates to the nutrition page and highlights when active. */}
                        <Link href="/nutrition" className={`${pathname === "/nutrition" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaAppleAlt className="mr-2" /> Nutrition Info
                        </Link>
                        {/* Shopping List link with icon, highlighted if the current path matches.
                           It's important for accessing the shopping list feature.
                           Use case: Navigates to the shopping list page and highlights when active. */}
                        <Link href="/shopping-list" className={`${pathname === "/shopping-list" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaShoppingCart className="mr-2" /> Shopping List
                        </Link>
                    </div>
                ) : (
                    // Display minimal routes if no username exists (user is not logged in).
                    // It's important for limiting access to authenticated features.
                    // Use case: Only shows the Home link for unauthenticated users.
                    <div className="hidden md:flex space-x-6 items-center">
                        {/* Home link with icon, highlighted if the current path is "/".
                           It's important for navigation even when not logged in.
                           Use case: Allows unauthenticated users to navigate to the homepage. */}
                        <Link href="/" className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`}>
                            <FaHome className="mr-2" /> Home
                        </Link>
                    </div>
                )}

                {/* Right Section: Authentication buttons for desktop screens (hidden on mobile).
                   It's important for displaying login/register options or username/logout for authenticated users.
                   Use case: Provides a way to log in, register, or log out directly from the Navbar. */}
                <div className="hidden md:flex space-x-4">
                    {/* Conditionally render based on username (logged in or not).
                       It's important for showing the correct authentication UI.
                       Use case: Displays username and logout button when logged in, or login/register links when not. */}
                    {username ? (
                        <>
                            {/* Display the username in a styled span.
                               It's important for showing the logged-in user's identity.
                               Use case: Informs the user who they are logged in as. */}
                            <span className="bg-white text-gray-900 py-1 px-3 rounded transition">{username}</span>
                            {/* Logout button to sign out the user.
                               It's important for allowing users to end their session.
                               Use case: Triggers the handleLogout function to log out and redirect. */}
                            <button onClick={handleLogout} className="bg-red-400 text-white py-1 px-3 rounded hover:bg-red-500 transition">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Login link for unauthenticated users.
                               It's important for providing access to the login page.
                               Use case: Allows users to sign in to access authenticated features. */}
                            <Link href="/login" className="bg-white text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition">
                                Login
                            </Link>
                            {/* Register link for unauthenticated users.
                               It's important for providing access to the registration page.
                               Use case: Allows new users to create an account. */}
                            <Link href="/register" className="bg-yellow-400 text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition">
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu: Dropdown menu visible only on mobile when isMenuOpen is true.
                   It's important for providing navigation and authentication options on smaller screens.
                   Use case: Replicates the desktop Navbar functionality in a mobile-friendly format. */}
                {isMenuOpen && (
                    // Container for the mobile menu with absolute positioning and gradient background.
                    // It's important for displaying the menu over the page content.
                    // Use case: Shows navigation links and buttons in a vertical layout on mobile.
                    <div className="absolute top-16 left-0 w-full bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center space-y-4 py-4 md:hidden">
                        {/* Conditionally render based on username (logged in or not).
                           It's important for showing the correct navigation options on mobile.
                           Use case: Displays authenticated routes or login/register links based on user state. */}
                        {username ? (
                            <>
                                {/* Home link for mobile, closes menu on click.
                                   It's important for navigation on mobile devices.
                                   Use case: Navigates to the homepage and closes the menu for a smooth UX. */}
                                <Link href="/" className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaHome className="mr-2" /> Home
                                </Link>
                                {/* Recipe Generator link for mobile, closes menu on click.
                                   It's important for accessing app features on mobile.
                                   Use case: Navigates to the recipe generator page and closes the menu. */}
                                <Link href="/recipe-generator" className={`${pathname === "/recipe-generator" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaUtensils className="mr-2" /> Recipe Generator
                                </Link>
                                {/* Upload Images link for mobile, closes menu on click.
                                   It's important for accessing the upload feature on mobile.
                                   Use case: Navigates to the uploads page and closes the menu. */}
                                <Link href="/uploads" className={`${pathname === "/uploads" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaUpload className="mr-2" /> Upload Images
                                </Link>
                                {/* Nutrition Info link for mobile, closes menu on click.
                                   It's important for accessing the nutrition feature on mobile.
                                   Use case: Navigates to the nutrition page and closes the menu. */}
                                <Link href="/nutrition" className={`${pathname === "/nutrition" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaAppleAlt className="mr-2" /> Nutrition Info
                                </Link>
                                {/* Shopping List link for mobile, closes menu on click.
                                   It's important for accessing the shopping list feature on mobile.
                                   Use case: Navigates to the shopping list page and closes the menu. */}
                                <Link href="/shopping-list" className={`${pathname === "/shopping-list" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaShoppingCart className="mr-2" /> Shopping List
                                </Link>
                                {/* Display the username in a styled span for mobile.
                                   It's important for showing the logged-in user's identity.
                                   Use case: Informs the user who they are logged in as on mobile. */}
                                <span className="bg-white text-gray-900 py-1 px-3 rounded transition">{username}</span>
                                {/* Logout button for mobile, triggers logout.
                                   It's important for allowing mobile users to sign out.
                                   Use case: Calls handleLogout to log out and redirect, also closes the menu. */}
                                <button onClick={handleLogout} className="bg-red-400 text-white py-1 px-3 rounded hover:bg-red-500 transition">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Home link for mobile (unauthenticated), closes menu on click.
                                   It's important for navigation even when not logged in.
                                   Use case: Allows unauthenticated mobile users to navigate to the homepage. */}
                                <Link href="/" className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition flex items-center`} onClick={() => setIsMenuOpen(false)}>
                                    <FaHome className="mr-2" /> Home
                                </Link>
                                {/* Login link for mobile, closes menu on click.
                                   It's important for providing access to the login page on mobile.
                                   Use case: Allows mobile users to sign in to access features. */}
                                <Link href="/login" className="bg-white text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition" onClick={() => setIsMenuOpen(false)}>
                                    Login
                                </Link>
                                {/* Register link for mobile, closes menu on click.
                                   It's important for providing access to the registration page on mobile.
                                   Use case: Allows new mobile users to create an account. */}
                                <Link href="/register" className="bg-yellow-400 text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition" onClick={() => setIsMenuOpen(false)}>
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

// Export the Navbar component as the default export.
// It's important for making the component reusable across the app.
// Use case: Allows the Navbar to be imported and used in layouts or pages (e.g., in a layout.tsx file).
export default Navbar;