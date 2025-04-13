export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">🎮 Crypto Ninja</h1>
      <div className="text-center max-w-2xl">
        <p className="text-xl mb-4">
          Welcome to Crypto Ninja - a fun game where you slice crypto coins!
        </p>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl mb-4">🔥 How to Play</h2>
          <p className="mb-2">
            1. Share this frame on Farcaster
          </p>
          <p className="mb-2">
            2. Choose the correct crypto coins
          </p>
          <p>
            3. Earn points and compete with others!
          </p>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-400">
            API Endpoint: /api/frame
          </p>
        </div>
      </div>
    </main>
  );
}