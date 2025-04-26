// This directive tells Next.js to render this component on the client side.
// It's important because Next-Auth's SessionProvider relies on client-side React context to manage authentication state.
// Use case: Enables the use of Next-Auth's session management features, such as accessing user session data, on the client side.
"use client";

// Import SessionProvider from next-auth/react to manage authentication sessions.
// It's important for providing a React context that makes the user's session data available to all components in the app.
// Use case: Allows components to access the user's authentication status (e.g., logged in or not) and user data (e.g., email, name) via the useSession hook.
import { SessionProvider } from "next-auth/react";

// Import ReactNode type from React for TypeScript type safety.
// It's important for defining the type of the children prop, ensuring TypeScript knows what kind of content can be passed to this component.
// Use case: Ensures that the children prop can accept any valid React element, such as JSX, strings, or other components.
import { JSX, ReactNode } from "react";

// Define an interface for the component's props to ensure TypeScript type safety.
// It's important for specifying the expected shape of the props passed to AuthProvider.
// Use case: Ensures that the children prop is required and must be a valid ReactNode, preventing type-related errors.
interface Props {
    // The children prop represents the nested components that AuthProvider will wrap.
    // It's important for passing child components that need access to the authentication session.
    // Use case: Allows AuthProvider to wrap the entire app or specific sections, making session data available to all child components.
    children: ReactNode;
}

// Define the AuthProvider functional component, which wraps its children with SessionProvider.
// It's important for setting up Next-Auth's session management across the app.
// Use case: Used in the app's root layout to ensure all pages and components can access the user's authentication session.
const AuthProvider = ({ children }: Props): JSX.Element => {
    // Return the SessionProvider component wrapping the children.
    // It's important for providing the authentication session context to all child components.
    // Use case: Makes the user's session data (e.g., user info, login status) available to any component via the useSession hook.
    return (
        // SessionProvider is a context provider from Next-Auth that manages the authentication session.
        // It's important for enabling session-related features like checking if a user is logged in or accessing user data.
        // Use case: Wraps the app's component tree so that hooks like useSession can access session data anywhere in the app.
        <SessionProvider>
            {/* Render the children passed to AuthProvider.
               It's important for ensuring that the entire app or a section of it is rendered within the session context.
               Use case: Allows all child components (e.g., pages, Navbar) to access the user's session data without additional setup. */}
            {children}
        </SessionProvider>
    );
};

// Export the AuthProvider component as the default export.
// It's important for making the component available for use in other parts of the app.
// Use case: Allows AuthProvider to be imported and used in the app's root layout to enable session management across all pages.
export default AuthProvider;