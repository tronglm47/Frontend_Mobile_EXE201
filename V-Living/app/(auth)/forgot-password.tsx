import React from 'react';
import { router } from 'expo-router';
import ForgotPassword from '@/components/forgot-password';

export default function ForgotPasswordScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleNext = (email: string) => {
    // Navigate to reset password screen with email parameter
    router.push({ pathname: '/reset-password', params: { email } } as any);
  };

  return (
    <ForgotPassword onBack={handleBack} onNext={handleNext} />
  );
}
