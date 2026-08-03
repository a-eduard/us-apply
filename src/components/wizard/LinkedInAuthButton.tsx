"use client";

import React, { useState } from 'react';

const MOCK_LINKEDIN_DATA = {
  firstName: "Alex",
  lastName: "Hunter",
  email: "alex.hunter@example.com",
  city: "San Francisco",
  country: "United States",
  linkedinUrl: "https://linkedin.com/in/alexhunter"
};

export const LinkedInAuthButton = ({ onSuccess }: { onSuccess: (data: typeof MOCK_LINKEDIN_DATA) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const mockLinkedInApiCall = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomEmail = `alex.hunter+${Math.random().toString(36).substring(2, 9)}@example.com`;
        resolve({
          ...MOCK_LINKEDIN_DATA,
          email: randomEmail
        });
      }, 1500); // 1.5 seconds artificial delay
    });
  };

  const handleLinkedInLogin = async () => {
    setIsLoading(true);
    try {
      const data: any = await mockLinkedInApiCall();
      onSuccess(data);
    } catch (error) {
      console.error("LinkedIn Auth Mock Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLinkedInLogin}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 bg-[#0077b5] text-white font-bold py-3 rounded-xl hover:bg-[#006396] transition-colors ${
        isLoading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <span>Connecting... (Mock)</span>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Continue with LinkedIn
        </>
      )}
    </button>
  );
};