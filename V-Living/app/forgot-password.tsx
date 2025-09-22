import React from 'react';
import { router } from 'expo-router';
import ForgotPassword from '@/components/forgot-password';

export default function ForgotPasswordScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleNext = (method: 'phone' | 'email') => {
    console.log('Selected method:', method);
    // Navigate to verification screen
    router.push('/verify-email' as any);
  };

  return (
    <ForgotPassword onBack={handleBack} onNext={handleNext} />
  );
}
