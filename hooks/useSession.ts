import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Player, Session, SessionStatus } from '../types';

const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export const useSession = () => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist player identity
  useEffect(() => {
    const storedId = localStorage.getItem('ogf_player_id');
    const storedName = localStorage.getItem('ogf_player_nickname');
    const storedCode = localStorage.getItem('ogf_session_code');

    if (storedId && storedName) {
      setCurrentPlayer({
        id: storedId,
        nickname: storedName,
        session_code: storedCode || '',
        is_active: true,
        joined_at: Date.now()
      });
    }
  }, []);

  // Subscribe to Session changes
  useEffect(() => {
    if (!currentPlayer?.session_code) return;

    const q = query(
      collection(db, 'sessions'), 
      where('code', '==', currentPlayer.session_code)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        setCurrentSession({ id: docData.id, ...docData.data() } as Session);
      } else {
        setCurrentSession(null);
      }
    }, (err) => {
        console.error("Session subscription error:", err);
    });

    return () => unsubscribe();
  }, [currentPlayer?.session_code]);

  // Subscribe to Players list
  useEffect(() => {
    if (!currentPlayer?.session_code) return;

    const q = query(
      collection(db, 'players'),
      where('session_code', '==', currentPlayer.session_code)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playerList: Player[] = [];
      snapshot.forEach((doc) => {
        playerList.push(doc.data() as Player);
      });
      setPlayers(playerList.sort((a, b) => a.joined_at - b.joined_at));
    });

    return () => unsubscribe();
  }, [currentPlayer?.session_code]);

  const createSession = useCallback(async (nickname: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateCode();
      const playerId = localStorage.getItem('ogf_player_id') || crypto.randomUUID();
      
      // Create Session
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        code,
        host_id: playerId,
        status: SessionStatus.LOBBY,
        created_at: serverTimestamp(),
        current_round_id: null
      });

      // Create Player
      const player: Player = {
        id: playerId,
        nickname,
        session_code: code,
        is_active: true,
        joined_at: Date.now()
      };

      await setDoc(doc(db, 'players', playerId), player);

      // Update Local State
      localStorage.setItem('ogf_player_id', playerId);
      localStorage.setItem('ogf_player_nickname', nickname);
      localStorage.setItem('ogf_session_code', code);
      setCurrentPlayer(player);
    } catch (err) {
      console.error(err);
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (code: string, nickname: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'sessions'), where('code', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Session not found");
      }

      const playerId = localStorage.getItem('ogf_player_id') || crypto.randomUUID();
      const player: Player = {
        id: playerId,
        nickname,
        session_code: code.toUpperCase(),
        is_active: true,
        joined_at: Date.now()
      };

      await setDoc(doc(db, 'players', playerId), player);

      localStorage.setItem('ogf_player_id', playerId);
      localStorage.setItem('ogf_player_nickname', nickname);
      localStorage.setItem('ogf_session_code', code.toUpperCase());
      setCurrentPlayer(player);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  }, []);

  const startVoting = useCallback(async () => {
    if (!currentSession) return;
    
    const roundRef = await addDoc(collection(db, 'rounds'), {
      session_code: currentSession.code,
      created_at: serverTimestamp(),
    });

    // Set 60 second timer
    // Note: In a real app, we might use a Cloud Function to ensure server-time accuracy,
    // but client-initiated serverTimestamp is okay for this prototype.
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + 60);

    await updateDoc(doc(db, 'sessions', currentSession.id), {
      status: SessionStatus.VOTING,
      current_round_id: roundRef.id,
      round_end_time: endTime 
    });
  }, [currentSession]);

  const submitVote = useCallback(async (targetId: string, reason: string) => {
    if (!currentSession?.current_round_id || !currentPlayer) return;

    await addDoc(collection(db, 'votes'), {
      round_id: currentSession.current_round_id,
      voter_id: currentPlayer.id,
      target_id: targetId,
      reason,
      session_code: currentSession.code,
      timestamp: serverTimestamp()
    });
  }, [currentSession, currentPlayer]);

  const endRound = useCallback(async () => {
    if (!currentSession) return;
    await updateDoc(doc(db, 'sessions', currentSession.id), {
      status: SessionStatus.FINISHED
    });
  }, [currentSession]);

  const endSession = useCallback(async () => {
    if (!currentSession) return;
    await updateDoc(doc(db, 'sessions', currentSession.id), {
      status: SessionStatus.ENDED,
      current_round_id: null
    });
  }, [currentSession]);

  return {
    currentPlayer,
    currentSession,
    players,
    loading,
    error,
    createSession,
    joinSession,
    startVoting,
    submitVote,
    endRound,
    endSession
  };
};
