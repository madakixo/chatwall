
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, StickyNote, Sticker, VoiceNote, LocationData, Photo, VideoMessage, GroupSession } from './types';
import StickyNoteItem from './components/StickyNoteItem';
import VoiceNoteItem from './components/VoiceNoteItem';
import PhotoItem from './components/PhotoItem';
import VideoItem from './components/VideoItem';
import GroupLobby from './components/GroupLobby';
import { generateSweetNote, getRelationshipAdvice, generateRomanticImage } from './geminiService';

const COLORS = ['#fef08a', '#fecaca', '#bfdbfe', '#bbf7d0', '#f5d0fe'];
const EMOJIS = ['❤️', '😘', '🔥', '🥰', '🍭', '✨', '🌹', '🥂'];

const MOCK_MEMBERS: User[] = [
  { id: 'u1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'available' },
  { id: 'u2', name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', status: 'available' },
  { id: 'u3', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', status: 'available' },
  { id: 'u4', name: 'Casey', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey', status: 'available' },
  { id: 'u5', name: 'Taylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor', status: 'available' },
  { id: 'u6', name: 'Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan', status: 'available' },
  { id: 'u7', name: 'Riley', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley', status: 'available' }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [groupSession, setGroupSession] = useState<GroupSession>({
    activePair: null,
    startTime: null,
    waitlist: []
  });

  // Wall state
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<VideoMessage[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<LocationData | null>(null);

  // UI state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [photoPrompt, setPhotoPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [advice, setAdvice] = useState('Welcome to the circle...');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isEavesdropping, setIsEavesdropping] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const dragTargetRef = useRef<{ id: string, type: 'note' | 'photo' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJoinCircle = () => {
    // Current user is always Alex in this demo
    setCurrentUser(MOCK_MEMBERS[0]);
    setIsPaired(false); // We start in the Lobby
    
    // Simulate someone else might be on the wall occasionally
    // For demo purposes, we'll keep it empty initially
  };

  const handleStartInteraction = (partnerId: string) => {
    const partnerUser = MOCK_MEMBERS.find(m => m.id === partnerId);
    if (!partnerUser || !currentUser) return;

    // Formally start session
    setPartner(partnerUser);
    setGroupSession(prev => ({
      ...prev,
      activePair: [currentUser.id, partnerId],
      startTime: Date.now()
    }));
    setIsPaired(true);

    // Initial notes for the pair
    setNotes([
      { id: 'n1', senderId: partnerId, text: `Hey ${currentUser.name}! Glad we connected.`, color: '#fef08a', timestamp: Date.now(), rotation: -2, x: 20, y: 15 }
    ]);
  };

  const handleEndInteraction = () => {
    setGroupSession(prev => ({
      ...prev,
      activePair: null,
      startTime: null
    }));
    setIsPaired(false);
    setPartner(null);
  };

  useEffect(() => {
    if (isPaired && currentUser && partner) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            userId: currentUser.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now()
          });
          setPartnerLocation({
            userId: partner.id,
            lat: pos.coords.latitude + 0.0005,
            lng: pos.coords.longitude - 0.0005,
            timestamp: Date.now()
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isPaired, currentUser, partner]);

  useEffect(() => {
    if (isPaired) {
      const fetchAdvice = async () => {
        const text = await getRelationshipAdvice(`Alex is now interacting with ${partner?.name}. Keep it sweet!`);
        setAdvice(text);
      };
      fetchAdvice();
    }
  }, [isPaired, partner]);

  const handleAddNote = useCallback((text: string) => {
    if (!text.trim() || !currentUser) return;
    const newNote: StickyNote = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      text,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      timestamp: Date.now(),
      rotation: Math.random() * 8 - 4,
      x: 30 + Math.random() * 20,
      y: 30 + Math.random() * 20,
    };
    setNotes(prev => [...prev, newNote]);
    setNoteText('');
    setIsNoteModalOpen(false);
  }, [currentUser]);

  const handleCreatePhoto = async () => {
    if (!photoPrompt.trim() || !currentUser) return;
    setIsLoadingAI(true);
    try {
      const imageUrl = await generateRomanticImage(photoPrompt);
      const newPhoto: Photo = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: currentUser.id,
        imageUrl,
        caption: photoPrompt,
        timestamp: Date.now(),
        rotation: Math.random() * 12 - 6,
        x: 40 + Math.random() * 10,
        y: 40 + Math.random() * 10,
      };
      setPhotos(prev => [...prev, newPhoto]);
      setPhotoPrompt('');
      setIsPhotoModalOpen(false);
    } catch (e) {
      alert("Failed to generate magic moment.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const url = URL.createObjectURL(file);
    const id = Math.random().toString(36).substr(2, 9);
    
    if (file.type.startsWith('image/')) {
        const newPhoto: Photo = { id, senderId: currentUser.id, imageUrl: url, caption: 'Moment Captured', timestamp: Date.now(), rotation: Math.random() * 10 - 5, x: 50, y: 50 };
        setPhotos(prev => [...prev, newPhoto]);
    } else if (file.type.startsWith('video/')) {
        const newVideo: VideoMessage = { id, senderId: currentUser.id, videoUrl: url, timestamp: Date.now(), rotation: Math.random() * 6 - 3, x: 50, y: 50 };
        setVideos(prev => [...prev, newVideo]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newVoice: VoiceNote = {
          id: Date.now().toString(),
          senderId: currentUser!.id,
          duration: Math.ceil(audioChunksRef.current.length / 2),
          audioBlobUrl: url,
          timestamp: Date.now(),
        };
        setVoiceNotes(prev => [...prev, newVoice]);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mic permission required.");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragTargetRef.current) return;
    const { id, type } = dragTargetRef.current;
    const x = (e.clientX / window.innerWidth) * 100 - 10;
    const y = (e.clientY / window.innerHeight) * 100 - 10;
    if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    else if (type === 'photo') setPhotos(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
    else if (type === 'video') setVideos(prev => prev.map(v => v.id === id ? { ...v, x, y } : v));
  };

  const handleMouseUp = () => {
    if (dragTargetRef.current) {
        const { id, type } = dragTargetRef.current;
        if (type === 'note') setNotes(prev => prev.map(n => n.id === id ? { ...n, isDragging: false } : n));
    }
    dragTargetRef.current = null;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 to-slate-900">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center space-y-8 border border-white/10">
          <div className="w-28 h-28 bg-pink-500 rounded-[35px] flex items-center justify-center mx-auto shadow-xl rotate-6 animate-pulse">
             <span className="text-5xl text-white">❤️</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white font-romantic">LoveWall</h1>
            <p className="text-indigo-200 font-medium italic">Enter your exclusive Circle of 7.</p>
          </div>
          <button
            onClick={handleJoinCircle}
            className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xl rounded-2xl transition-all shadow-xl shadow-pink-500/20 active:scale-95"
          >
            Enter Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!isPaired) {
    return (
      <GroupLobby 
        currentUser={currentUser} 
        members={MOCK_MEMBERS} 
        session={groupSession}
        onSelectPartner={handleStartInteraction}
      />
    );
  }

  return (
    <div 
      className="relative h-screen overflow-hidden flex flex-col bg-pink-50/30"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />

      {/* Wall Canvas */}
      <div className="flex-grow relative bg-[radial-gradient(#fecaca_1px,transparent_1px)] [background-size:32px_32px]">
        
        {/* Top Header */}
        <div className="absolute top-6 left-6 right-6 z-50 flex items-start justify-between gap-4 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-pink-100 flex items-center gap-3 pointer-events-auto">
                <div className="relative">
                    <img src={partner?.avatar} className="w-12 h-12 rounded-full border-2 border-pink-500 bg-white" alt="partner" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">{partner?.name} & You</p>
                    <button 
                      onClick={handleEndInteraction}
                      className="text-[10px] text-pink-600 font-bold uppercase tracking-wider hover:underline"
                    >
                      Leave Session
                    </button>
                </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-indigo-50 border-l-4 border-l-indigo-400 max-w-sm pointer-events-auto">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Relationship Coach</p>
                <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{advice}"</p>
            </div>
        </div>

        {/* Notes/Photos/Videos/Stickers - Rendered exactly as before */}
        {notes.map(note => (
          <StickyNoteItem 
            key={note.id} 
            note={note} 
            isOwn={note.senderId === currentUser.id} 
            onMouseDown={() => dragTargetRef.current = { id: note.id, type: 'note' }}
          />
        ))}

        {photos.map(photo => (
          <PhotoItem key={photo.id} photo={photo} isOwn={photo.senderId === currentUser.id} />
        ))}

        {videos.map(video => (
          <VideoItem 
            key={video.id} 
            video={video} 
            isOwn={video.senderId === currentUser.id} 
            onMouseDown={() => dragTargetRef.current = { id: video.id, type: 'video' }}
          />
        ))}

        {/* Control Center - Same as before */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
          <div className="p-6 bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-[50px] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-50 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button onClick={() => setIsNoteModalOpen(true)} className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center active:scale-90 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button onClick={() => setIsPhotoModalOpen(true)} className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center active:scale-90 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center active:scale-90 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
            </div>

            <button onMouseDown={startRecording} onMouseUp={() => mediaRecorderRef.current?.stop()} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110' : 'bg-pink-500'} text-white shadow-xl active:scale-95`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>

            <button onClick={() => setIsEavesdropping(!isEavesdropping)} className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEavesdropping ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.343 6.343c5.857-5.857 15.355-5.857 21.213 0" /></svg></button>
          </div>
        </div>
      </div>

      {/* Modals - Same logic */}
      {(isNoteModalOpen || isPhotoModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800">{isNoteModalOpen ? 'New Note' : 'Create Magic'}</h3>
                <button onClick={() => { setIsNoteModalOpen(false); setIsPhotoModalOpen(false); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              {isNoteModalOpen ? (
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Type a sweet message..." className="w-full h-48 p-6 bg-pink-50 border-none rounded-3xl outline-none font-romantic text-3xl placeholder:text-pink-200" />
              ) : (
                <input value={photoPrompt} onChange={(e) => setPhotoPrompt(e.target.value)} placeholder="Describe a romantic scene..." className="w-full p-6 bg-indigo-50 border-none rounded-3xl outline-none" />
              )}
              <div className="flex gap-3">
                {isNoteModalOpen && <button onClick={async () => {setIsLoadingAI(true); const t = await generateSweetNote(noteText); setNoteText(t); setIsLoadingAI(false);}} className="flex-grow py-4 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-100">{isLoadingAI ? '...' : 'AI Help'}</button>}
                <button onClick={isNoteModalOpen ? () => handleAddNote(noteText) : handleCreatePhoto} className="px-10 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold">{isLoadingAI ? '...' : 'Post'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
