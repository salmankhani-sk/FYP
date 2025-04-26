// This directive tells Next.js to render this component on the client side.
// It's important because it enables the use of client-side features like Framer Motion animations.
// Use case: Allows the 404 page to include dynamic animations for a better user experience.
"use client";

// Import the Link component from Next.js for client-side navigation.
// It's important for providing smooth navigation back to the homepage without a full page reload.
// Use case: Used in the "Back to Home" button to redirect users to the root route ("/").
import Link from "next/link";

// Import motion from Framer Motion, a library for animations.
// It's important for creating engaging, smooth transitions and effects to enhance the visual appeal.
// Use case: Animates the 404 text, message, and image to make the error page more interactive.
import { motion } from "framer-motion";

// Import the Image component from Next.js for optimized image handling.
// It's important for improving performance with automatic optimization, lazy loading, and responsive sizing.
// Use case: Displays a dish image on the 404 page with optimized loading for better performance.
import Image from "next/image";
import { JSX } from "react";

// Define the NotFoundPage functional component as the default export for Next.js App Router.
// It's important because it serves as the custom 404 error page for the app.
// Use case: Renders a user-friendly error page when a user navigates to a non-existent route.
export default function NotFoundPage(): JSX.Element {
    // Return the JSX structure that defines the 404 page layout and content.
    // It's important for rendering the error page UI that users will see.
    // Use case: Displays a 404 message, an animated image, and a link to return to the homepage.
    return (
        // Main wrapper element with a light gray background, full-screen height, and centered content.
        // It's important for setting the overall page style and ensuring content is centered vertically and horizontally.
        // Use case: Provides a clean, centered layout for the 404 error message and elements.
        <main className="bg-gray-50 min-h-screen flex items-center justify-center">
            {/* Container for the 404 content with a gradient background, white text, padding, and centered alignment.
               It's important for creating a visually striking section that highlights the error.
               Use case: Styles the 404 section with an orange-to-red gradient to draw attention. */}
            <motion.div
                // Apply styles to constrain the content width and center it.
                // It's important for responsive design and maintaining layout consistency.
                // Use case: Ensures the content doesn’t stretch too wide on larger screens.
                className="max-w-6xl mx-auto bg-gradient-to-r from-orange-500 to-red-500 text-white py-16 px-4 text-center w-full"
                // Initial state: invisible and positioned 50px above its final spot.
                // It's important for setting up the animation starting point.
                // Use case: Prepares the section to slide into view smoothly.
                initial={{ opacity: 0, y: -50 }}
                // Final state: fully visible and at its normal position.
                // It's important for completing the animation effect.
                // Use case: Brings the section into view for users to see.
                animate={{ opacity: 1, y: 0 }}
                // Animation settings: 1-second duration for a smooth transition.
                // It's important for controlling the speed of the effect.
                // Use case: Ensures the animation feels natural and not too fast or slow.
                transition={{ duration: 1 }}
            >
                {/* Animated h1 heading displaying the "404" error code.
                   It's important for clearly indicating that the page was not found.
                   Use case: Informs users of the 404 error with a large, animated number. */}
                <motion.h1
                    // Styles for the heading: large text, bold, with responsive sizing and margin.
                    // It's important for readability and visual hierarchy.
                    // Use case: Ensures the 404 text is prominent on both mobile and desktop screens.
                    className="text-6xl md:text-8xl font-bold mb-4"
                    // Initial state: scaled down to 80% of its final size.
                    // It's important for setting up the scale animation starting point.
                    // Use case: Prepares the 404 text to grow into view.
                    initial={{ scale: 0.8 }}
                    // Final state: scaled to its normal size (100%).
                    // It's important for completing the scale animation effect.
                    // Use case: Makes the 404 text appear with a growing effect.
                    animate={{ scale: 1 }}
                    // Animation settings: 0.8-second duration for a smooth transition.
                    // It's important for controlling the speed of the scale effect.
                    // Use case: Ensures the animation is smooth and visually appealing.
                    transition={{ duration: 0.8 }}
                >
                    404
                </motion.h1>
                {/* Animated paragraph explaining the error to the user.
                   It's important for providing context about the 404 error in a friendly way.
                   Use case: Informs users that the page or recipe they’re looking for couldn’t be found. */}
                <motion.p
                    // Styles for the paragraph: medium/large text with margin for spacing.
                    // It's important for readability and layout balance.
                    // Use case: Adjusts text size responsively for different devices.
                    className="text-lg md:text-2xl mb-8"
                    // Initial state: invisible to start the fade-in effect.
                    // It's important for setting up the animation.
                    // Use case: Prepares the message to appear after the 404 text.
                    initial={{ opacity: 0 }}
                    // Final state: fully visible.
                    // It's important for completing the fade-in animation.
                    // Use case: Makes the message readable after the animation.
                    animate={{ opacity: 1 }}
                    // Animation settings: 0.5s delay and 1s duration.
                    // It's important for timing the appearance after the 404 text.
                    // Use case: Creates a staggered effect for a polished look.
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    Oops! It seems we couldn’t find that recipe (or page)!
                </motion.p>

                {/* Animated div to rotate the dish image, adding visual interest.
                   It's important for making the error page more engaging with motion.
                   Use case: Displays a rotating dish image to keep the page lively despite the error. */}
                <motion.div
                    // Styles for the image container: fixed size and centered.
                    // It's important for consistent image presentation.
                    // Use case: Ensures the dish image is uniformly displayed in the center.
                    className="w-64 h-64 mx-auto mb-8"
                    // Animation: rotate 360 degrees continuously.
                    // It's important for creating a dynamic visual effect.
                    // Use case: Draws attention to the image with constant rotation.
                    animate={{ rotate: 360 }}
                    // Animation settings: 10s duration, infinite loop, linear easing.
                    // It's important for smooth, endless rotation.
                    // Use case: Keeps the animation seamless and unobtrusive.
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    {/* Image component to display a dish image on the 404 page.
                       It's important for optimized loading and rendering of the image.
                       Use case: Shows a dish image to maintain the app’s food theme even on an error page. */}
                    <Image
                        // Source URL of the dish image.
                        // It's important for linking the correct image file.
                        // Use case: Loads a specific dish image to display on the 404 page.
                        src="/Images/1ff7362d-341d-4a3c-83d5-dc1a9a67dd2b-removebg-preview.png"
                        // Alt text for accessibility and SEO.
                        // It's important for describing the image to screen readers.
                        // Use case: Ensures the image is understandable if it fails to load or for accessibility.
                        alt="Lost Dish"
                        // Fixed width of 256px for consistent sizing.
                        // It's important for uniform appearance.
                        // Use case: Matches the container size for proper fit.
                        width={256}
                        // Fixed height of 256px for consistent sizing.
                        // It's important for maintaining aspect ratio with width.
                        // Use case: Keeps the image proportional within the container.
                        height={256}
                        // Styles: contain the image and round it into a circle.
                        // It's important for aesthetic appeal and focus.
                        // Use case: Creates a circular frame for the dish image.
                        className="object-contain rounded-full"
                    />
                </motion.div>

                {/* Link component styled as a button to navigate back to the homepage.
                   It's important for providing a clear call-to-action (CTA) to return to a valid page.
                   Use case: Allows users to easily navigate back to the homepage after encountering the 404 error. */}
                <Link
                    // URL path to the homepage.
                    // It's important for directing users back to a safe starting point.
                    // Use case: Connects the 404 page to the root route ("/").
                    href="/"
                    // Styles for the button: yellow background, hover effect, and spacing.
                    // It's important for making the CTA visually appealing and interactive.
                    // Use case: Highlights the button and provides feedback on hover.
                    className="inline-block bg-yellow-400 text-gray-900 px-6 py-3 rounded-md text-lg font-semibold hover:bg-yellow-300 transition"
                >
                    Back to Home
                </Link>
            </motion.div>
        </main>
    );
};