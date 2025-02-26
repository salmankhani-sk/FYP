// components/ProtectedRouteChecker.tsx
"use client"; // Ensure this is a client component

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const publicRoutes = ["/", "/login", "/register"];

const isLoggedIn = () => {
    return !!localStorage.getItem("token");
};

const ProtectedRouteChecker = () => {
    const router = useRouter();
    const currentPath = router.asPath;

    useEffect(() => {
        if (!publicRoutes.includes(currentPath) && !isLoggedIn()) {
            router.push("/login");
        }
    }, [router, currentPath]);

    return null;
};

export default ProtectedRouteChecker;