import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export const SignUpPage: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <SignUp path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
        </div>
    );
};
