'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// Import the js-cookie library
import Cookies from 'js-cookie';

const handleLogin = async () => {
  setError("");
  try {
    const response = await axios.post("http://localhost:8000/login", {
      username,
      password,
    });
    const token = response.data.access_token;
    // Set the token as a cookie
    Cookies.set("token", token, { expires: 7 }); // Expires in 7 days
    alert("Login successful!");
    router.push("/recipe-generator");
  } catch (error) {
    console.error("Login failed:", error);
    setError("Login failed! Please check your credentials.");
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/login', {
        username,
        password,
      });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      alert('Login successful!');
      router.push('/recipe-generator');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed! Please check your credentials.');
    }
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300"
        >
          Login
        </button>
        <div onClick={handleSignUp}>
        <p className="text-center text-blue-500 underline cursor-pointer mt-4">
          Don&apos;t have an account?{' '}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            
          >
            Sign up
          </span>
        </p></div>
      </div>
    </div>
  );
};

export default Login;
