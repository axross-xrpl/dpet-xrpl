import React from "react";

type LoadingOverlayProps = {
  message?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
        <div className="loader mb-4"></div>
        <p className="text-yellow-700 font-semibold">{message}</p>
      </div>
    </div>
  );
};
