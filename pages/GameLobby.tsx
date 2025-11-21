import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { SessionStatus, VOTE_REASONS, Vote, Player } from '../types';
import Timer from '../components/Timer';
import WheelOfMisfortune from '../components/WheelOfMisfortune';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const GameLobby: React.FC = () => {
  const { 
    currentSession, 
    currentPlayer, 
    players, 
    startVoting, 
    submitVote, 
    endRound,
    endSession 
  } = useSession();

  const [roundVotes, setRoundVotes] = useState<Vote[]>([]);
  const [sessionVotes, setSessionVotes] = useState<Vote[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Player | null>(null);
  const [tieBreakerCandidates, setTieBreakerCandidates] = useState<{name: string, id: string}[]>([]);
  const [roundEndedEarly, setRoundEndedEarly] = useState(false);
  const isHost = currentPlayer?.id === currentSession?.host_id;

  // Real-time votes listener
  useEffect(() => {
    if (!currentSession?.current_round_id) return;

    const q = query(
      collection(db, 'votes'),
      where('round_id', '==', currentSession.current_round_id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newVotes: Vote[] = [];
      snapshot.forEach(doc => newVotes.push(doc.data() as Vote));
      setRoundVotes(newVotes);
    });

    return () => unsubscribe();
  }, [currentSession?.current_round_id]);

  // Session-wide votes listener (for overall results)
  useEffect(() => {
    if (!currentSession?.code) return;

    const q = query(
      collection(db, 'votes'),
      where('session_code', '==', currentSession.code)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newVotes: Vote[] = [];
      snapshot.forEach(doc => newVotes.push(doc.data() as Vote));
      setSessionVotes(newVotes);
    });

    return () => unsubscribe();
  }, [currentSession?.code]);

  // Detect if current user has voted
  useEffect(() => {
    if (currentPlayer && roundVotes.some(v => v.voter_id === currentPlayer.id)) {
      setHasVoted(true);
    } else {
      setHasVoted(false);
    }
  }, [roundVotes, currentPlayer]);

  // End round early when every player has voted (host only triggers the write)
  useEffect(() => {
    if (currentSession?.status !== SessionStatus.VOTING) {
      if (roundEndedEarly) setRoundEndedEarly(false);
      return;
    }

    const uniqueVoters = new Set(roundVotes.map(v => v.voter_id));
    const activePlayers = players.length;

    if (
      currentPlayer?.id === currentSession.host_id &&
      activePlayers > 0 &&
      uniqueVoters.size >= activePlayers &&
      !roundEndedEarly
    ) {
      setRoundEndedEarly(true);
      endRound();
    }
  }, [currentSession?.status, currentSession?.host_id, currentPlayer?.id, roundVotes, players, endRound, roundEndedEarly]);

  // Calculate Results & Ties
  const getResults = (sourceVotes: Vote[]) => {
    const counts: Record<string, number> = {};
    sourceVotes.forEach(v => {
      counts[v.target_id] = (counts[v.target_id] || 0) + 1;
    });

    const data = players.map(p => ({
      name: p.nickname,
      id: p.id,
      votes: counts[p.id] || 0
    })).sort((a, b) => b.votes - a.votes);

    return data;
  };

  useEffect(() => {
    if (currentSession?.status === SessionStatus.ENDED) {
      const results = getResults(sessionVotes.length ? sessionVotes : roundVotes);
      if (results.length >= 2 && results[0].votes > 0 && results[0].votes === results[1].votes) {
        // Identify all tied players for first place (session total)
        const maxVotes = results[0].votes;
        const ties = results.filter(r => r.votes === maxVotes);
        setTieBreakerCandidates(ties);
      } else {
        setTieBreakerCandidates([]);
      }
    } else {
      setTieBreakerCandidates([]);
    }
  }, [currentSession?.status, sessionVotes, roundVotes]);


  const handleVote = (reason: string) => {
    if (selectedTarget) {
      submitVote(selectedTarget.id, reason);
      setSelectedTarget(null);
    }
  };

  const roundResults = getResults(roundVotes);
  const overallResults = getResults(sessionVotes.length ? sessionVotes : roundVotes);

  if (!currentSession) return <div className="p-10 text-center">Loading Session...</div>;

  // -- VIEW: LOBBY --
  if (currentSession.status === SessionStatus.LOBBY) {
    const isHost = currentSession.host_id === currentPlayer?.id;
    return (
      <div className="flex flex-col items-center min-h-screen p-6 max-w-md mx-auto">
        <div className="bg-slate-800 p-6 rounded-2xl w-full shadow-xl mb-8 text-center border border-slate-700">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Session Code</p>
          <h1 className="text-6xl font-black text-ea-green tracking-tighter">{currentSession.code}</h1>
        </div>

        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Squad ({players.length})</h2>
            {isHost && <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">You are Host</span>}
          </div>
          <ul className="space-y-3">
            {players.map(p => (
              <li key={p.id} className={`flex items-center p-3 rounded-lg border ${p.id === currentPlayer?.id ? 'bg-slate-800 border-ea-green' : 'bg-slate-800 border-slate-700'}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm mr-3">
                  {p.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{p.nickname}</span>
                {p.id === currentSession.host_id && <span className="ml-auto text-xs text-yellow-500">👑</span>}
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <div className="mt-auto w-full sticky bottom-6">
            <button 
              onClick={startVoting}
              className="w-full bg-ea-green hover:bg-green-400 text-black font-black py-4 rounded-xl text-xl shadow-lg shadow-green-900/20 transition-all active:scale-95"
            >
              KICK OFF VOTE
            </button>
          </div>
        )}
        
        {!isHost && (
          <div className="mt-auto text-slate-500 animate-pulse">
            Waiting for host to start match...
          </div>
        )}
      </div>
    );
  }

  // -- VIEW: VOTING --
  if (currentSession.status === SessionStatus.VOTING) {
    return (
      <div className="flex flex-col h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md z-10">
          <h2 className="font-bold text-lg text-slate-300">Vote for Shame</h2>
          <Timer endTime={currentSession.round_end_time} onFinish={currentPlayer?.id === currentSession.host_id ? endRound : undefined} />
        </div>

        {/* Voting Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasVoted ? (
            <div className="grid grid-cols-2 gap-4">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedTarget(p)}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-ea-red rounded-xl p-6 flex flex-col items-center transition-all active:scale-95 group"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-700 group-hover:bg-red-900/50 flex items-center justify-center text-2xl mb-3 transition-colors">
                    {p.nickname.charAt(0)}
                  </div>
                  <span className="font-bold text-lg truncate w-full text-center">{p.nickname}</span>
                </button>
              ))}
            </div>
          ) : (
             <div className="flex flex-col space-y-2 items-center justify-center text-center h-full">
                <div className="text-5xl mb-2">🗳️</div>
                <h3 className="text-2xl font-bold mb-1">Vote Cast!</h3>
                <p className="text-slate-400">Waiting for everyone to finish or the clock to hit zero.</p>
                <p className="text-sm text-slate-500 mt-1">{roundVotes.length}/{players.length} votes locked in</p>
             </div>
          )}
        </div>

        {/* Reason Modal */}
        {selectedTarget && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 border border-slate-600 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-center">
                Why is <span className="text-ea-red">{selectedTarget.nickname}</span> the worst?
              </h3>
              <div className="space-y-2">
                {VOTE_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleVote(reason)}
                    className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectedTarget(null)}
                className="mt-4 w-full py-3 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -- VIEW: RESULTS --
  if (currentSession.status === SessionStatus.FINISHED) {
    const results = overallResults;
    const totalVotes = overallResults.reduce((sum, r) => sum + r.votes, 0);
    
    return (
      <div className="min-h-screen p-4 flex flex-col max-w-md mx-auto">
        <h1 className="text-3xl font-black text-center mb-6 text-white uppercase italic">
          Hall of <span className="text-ea-red">Shame</span>
        </h1>
        <p className="text-center text-slate-400 text-sm mb-2">Session votes recorded: {totalVotes}</p>

        <div className="bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-700 mb-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#fff'}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}}
              />
              <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                {results.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-400 uppercase text-sm">Shame Stats</h3>
          {results.map((r, idx) => {
             if (r.votes === 0) return null;
             // Find top reason
             const myVotes = sessionVotes.filter(v => v.target_id === r.id);
             const reasons: Record<string, number> = {};
             myVotes.forEach(v => reasons[v.reason] = (reasons[v.reason] || 0) + 1);
             const topReason = Object.entries(reasons).sort((a,b) => b[1] - a[1])[0]?.[0];

             return (
               <div key={r.id} className={`p-4 rounded-xl flex justify-between items-center ${idx === 0 ? 'bg-red-900/20 border border-red-500/50' : 'bg-slate-800'}`}>
                 <div>
                   <div className="font-bold text-lg">{r.name}</div>
                   <div className="text-xs text-slate-400">{topReason || "Existing"}</div>
                 </div>
                 <div className="text-2xl font-black text-slate-200">{r.votes}</div>
               </div>
             )
          })}
        </div>

        {currentPlayer?.id === currentSession.host_id && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={startVoting}
              className="w-full bg-white text-black font-bold py-3 rounded-xl shadow-lg"
            >
              Another Round
            </button>
            <button 
              onClick={endSession}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg"
            >
              End Session
            </button>
          </div>
        )}
      </div>
    );
  }

  // -- VIEW: SESSION ENDED / OVERALL LOSER --
  if (currentSession.status === SessionStatus.ENDED) {
    const overallResults = getResults(sessionVotes.length ? sessionVotes : roundVotes);
    const topVoteCount = overallResults[0]?.votes || 0;
    const overallLosers = overallResults.filter(r => r.votes === topVoteCount && topVoteCount > 0);

    return (
      <div className="min-h-screen p-4 flex flex-col max-w-md mx-auto">
        <h1 className="text-3xl font-black text-center mb-6 text-white uppercase italic">
          Final <span className="text-ea-red">Verdict</span>
        </h1>

        <div className="bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-700 mb-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overallResults} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#fff'}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}}
              />
              <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                {overallResults.map((entry, index) => (
                  <Cell key={`overall-${entry.id}`} fill={index === 0 ? '#ef4444' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {overallLosers.length === 0 && (
          <div className="text-center text-slate-400">
            Not enough shame recorded to crown a loser. Run another round!
          </div>
        )}

        {overallLosers.length === 1 && (
          <div className="text-center text-2xl font-black text-white bg-red-600 px-6 py-3 rounded-lg shadow-lg">
            {overallLosers[0].name} is the Hall of Shame winner.
          </div>
        )}

        {overallLosers.length > 1 && (
          <WheelOfMisfortune 
            candidates={overallLosers} 
            onSpinComplete={() => {
              // purely for UI feedback
            }}
            canSpin={!!isHost}
          />
        )}
      </div>
    );
  }

  return null;
};

export default GameLobby;
