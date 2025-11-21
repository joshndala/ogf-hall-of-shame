import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import GameLobby from './pages/GameLobby';

// -- LOGIN COMPONENT (Internal) --
const LoginScreen = () => {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(true);
  const navigate = useNavigate();
  const { createSession, joinSession, loading, error, currentSession } = useSession();

  // Redirect if session is active
  React.useEffect(() => {
    if (currentSession) {
      navigate('/game');
    }
  }, [currentSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) return;

    if (isJoining) {
      await joinSession(code, nickname);
    } else {
      await createSession(nickname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-black">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black text-center mb-2 italic tracking-tighter text-white">
          OGF <span className="text-ea-red">HALL OF SHAME</span>
        </h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Who sold the match? Vote now.
        </p>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700">
          <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsJoining(true)}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isJoining ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              JOIN
            </button>
            <button
              onClick={() => setIsJoining(false)}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isJoining ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              CREATE
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nickname</label>
              <input
                type="text"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-ea-green transition-colors placeholder-slate-600"
                placeholder="e.g. CR7"
                required
              />
            </div>

            {isJoining && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Room Code</label>
                <input
                  type="text"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-center tracking-widest uppercase focus:outline-none focus:border-ea-green transition-colors placeholder-slate-600"
                  placeholder="ABCD"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-xs text-center bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-slate-200 text-black font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'LOADING...' : (isJoining ? 'ENTER LOBBY' : 'CREATE SESSION')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/game" element={<GameLobby />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;