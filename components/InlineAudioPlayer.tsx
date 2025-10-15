import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../src/store/useStore.ts';

interface InlineAudioPlayerProps {
    fileId: string;
    src: string;
    duration: number;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) {
        seconds = 0;
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({ fileId, src, duration }) => {
    const { playingFileId, setPlayingFileId } = useStore();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false); // Local playing state

    // Sync local state with global state: if another file starts playing, stop this one.
    useEffect(() => {
        if (playingFileId !== fileId && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [playingFileId, fileId, isPlaying]);
    
    // Reset time when playback stops
    useEffect(() => {
        if (!isPlaying && currentTime > 0) {
            setCurrentTime(0);
            if(audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [isPlaying, currentTime]);


    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            if (playingFileId === fileId) {
                setPlayingFileId(null);
            }
        } else {
            // Set the global state to pause other players.
            setPlayingFileId(fileId);
            // The play() action must be in a user-initiated event handler.
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Playback started successfully.
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Audio playback was prevented:", error);
                    setIsPlaying(false);
                    setPlayingFileId(null);
                });
            }
        }
    };


    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = Number(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    
    const handleAudioEnded = () => {
        setIsPlaying(false);
        if (playingFileId === fileId) {
            setPlayingFileId(null);
        }
    };

    const handleAudioError = () => {
        console.error(`[AudioPlayer] Failed to load audio source: ${src}`);
        setIsPlaying(false);
        if (playingFileId === fileId) {
            setPlayingFileId(null);
        }
    };

    return (
        <div className="flex items-center gap-2 w-48">
            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate} // Set initial time
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                preload="metadata"
            />
            <button onClick={handlePlayPause} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 p-1">
                <span className="material-symbols-outlined text-2xl">
                    {isPlaying ? 'pause' : 'play_arrow'}
                </span>
            </button>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-24 flex-shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                style={{'--thumb-color': 'rgb(79 70 229)'} as React.CSSProperties}
            />
        </div>
    );
};

export default InlineAudioPlayer;