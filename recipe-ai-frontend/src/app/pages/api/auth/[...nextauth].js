// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

export default NextAuth({
  providers: [
    Providers.Credentials({
      // Your credential provider configuration
    }),
    // Add other providers here
  ],
  // Additional NextAuth.js configuration options
});
