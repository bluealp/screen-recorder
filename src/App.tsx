import React, { useState, useRef } from 'react';
import { Video, Mic, StopCircle, Download } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number>();
  const [error, setError] = useState<string>('');

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Combine both streams
      const tracks = [...displayStream.getTracks(), ...stream.getAudioTracks()];
      const combinedStream = new MediaStream(tracks);

      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        tracks.forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      setError('');
    } catch (err) {
      setError('Failed to start recording. Please ensure you have granted necessary permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      setTimer(0);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `Recording_${timestamp}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Screen Recorder
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-xl">{formatTime(timer)}</span>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <Video size={20} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <StopCircle size={20} />
                <span>Stop Recording</span>
              </button>
            )}
          </div>

          {recordedChunks.length > 0 && !isRecording && (
            <div className="flex justify-center">
              <button
                onClick={downloadRecording}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <Download size={20} />
                <span>Download Recording</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">Features:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Record screen content with audio</li>
            <li>Capture microphone input</li>
            <li>Download recordings in WebM format</li>
            <li>Recording timer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;