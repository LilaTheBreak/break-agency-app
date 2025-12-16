export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-blue-600 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
}
