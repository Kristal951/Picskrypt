import React, { useEffect } from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "info" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: Check, borderColor: "border-green-500", bgColor: "bg-green-100", iconColor: "text-green-500" },
    info: { icon: Info, borderColor: "border-blue-500", bgColor: "bg-blue-100", iconColor: "text-blue-500" },
    error: { icon: TriangleAlert, borderColor: "border-red-500", bgColor: "bg-red-100", iconColor: "text-red-500" },
  };

  const selectedConfig = config[type];
  const IconComponent = selectedConfig.icon;

  return (
    <div
      className={`flex items-center p-2 gap-2 max-w-sm w-full rounded-lg shadow-lg border ${selectedConfig.borderColor} bg-white`}
      role="alert"
    >
      <div
        className={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${selectedConfig.bgColor} ${selectedConfig.iconColor}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="ml-3 text-sm font-medium text-gray-800">{message}</div>

      <button
        type="button"
        onClick={onClose}
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-gray-200 inline-flex h-8 w-8"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-5 h-5 text-gray-300" />
      </button>
    </div>
  );
};

export default Toast;
