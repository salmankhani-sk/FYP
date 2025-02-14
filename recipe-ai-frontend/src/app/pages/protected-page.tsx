import { useEffect } from "react";
import { useRouter } from "next/router";

const ProtectedPage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  return <h1>Welcome to the protected page!</h1>;
};

export default ProtectedPage;
