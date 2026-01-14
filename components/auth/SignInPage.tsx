import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const SignInPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <SignIn path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
    </div>
  );
};
