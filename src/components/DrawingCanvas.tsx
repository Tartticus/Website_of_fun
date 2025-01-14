import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pencil, RotateCcw, Download, Palette, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface DrawingCanvasProps {
  backgroundImage?: string;
  twitterUsername: string;
}

const COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff8c00', // Dark Orange
  '#8b4513', // Saddle Brown
];

export function DrawingCanvas({ 
  backgroundImage = 'https://i.imgur.com/s0afmCO.png',
  twitterUsername 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1200;
    canvas.height = 900;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.lineCap = 'round';
    context.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    context.lineWidth = tool === 'pen' ? 3 : 30;
    contextRef.current = context;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = backgroundImage;
    image.onload = () => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const aspectRatio = image.width / image.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      if (canvas.width / canvas.height > aspectRatio) {
        drawWidth = canvas.height * aspectRatio;
      } else {
        drawHeight = canvas.width / aspectRatio;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      context.drawImage(image, x, y, drawWidth, drawHeight);
    };
  }, [backgroundImage, tool, color]);

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = backgroundImage;
    image.onload = () => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const aspectRatio = image.width / image.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      if (canvas.width / canvas.height > aspectRatio) {
        drawWidth = canvas.height * aspectRatio;
      } else {
        drawHeight = canvas.width / aspectRatio;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      context.drawImage(image, x, y, drawWidth, drawHeight);
    };
  };

  const saveImage = async () => {
    if (!canvasRef.current || !twitterUsername) return;
    
    const data = canvasRef.current.toDataURL('image/png', 1.0);
    setImageData(data);
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Create CSV data with PNG link
    const csvData = [
      ['Twitter Username', 'Date Submitted', 'Date Fulfilled', 'Minted', 'PNG Link'],
      [twitterUsername, today, '', 'false', data]
    ].map(row => row.join(',')).join('\n');

    // Create CSV file
    const csvBlob = new Blob([csvData], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    
    // Download CSV
    const csvLink = document.createElement('a');
    csvLink.download = `passes.csv`;
    csvLink.href = csvUrl;
    csvLink.click();

    URL.revokeObjectURL(csvUrl);
    alert('Pass saved locally! Click "Get it signed" to submit for signing.');
  };

  const requestSigning = async () => {
    if (!imageData || !twitterUsername) return;
    
    setIsSending(true);
    try {
      // Send email notification
      await emailjs.send(
        'service_your_service_id',
        'template_your_template_id',
        {
          to_email: 'Johnbummit@gmail.com',
          twitter_username: twitterUsername,
          image_data: imageData,
        },
        'your_public_key'
      );

      alert('Your pass has been submitted for signing! You will receive an email when it\'s ready.');
    } catch (error) {
      console.error('Error requesting signing:', error);
      alert('There was an error submitting your pass. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 mb-4 items-center">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded ${
            tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          <Pencil className="w-6 h-6" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded ${
            tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          <Eraser className="w-6 h-6" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded bg-gray-200 hover:bg-gray-300"
            style={{ 
              backgroundColor: tool === 'pen' ? color : '#ffffff',
              border: '2px solid #e5e7eb'
            }}
          >
            <Palette className="w-6 h-6" style={{ color: tool === 'pen' ? (color === '#ffffff' ? '#000000' : '#ffffff') : '#000000' }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full mt-2 p-2 bg-white rounded-lg shadow-xl grid grid-cols-5 gap-2 z-10">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                    setTool('pen');
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={clearCanvas}
          className="p-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={saveImage}
          disabled={isSending || !twitterUsername}
          className={`p-2 rounded ${
            isSending || !twitterUsername
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          <Download className="w-6 h-6" />
        </button>
        {imageData && (
          <button
            onClick={requestSigning}
            disabled={isSending || !twitterUsername}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              isSending || !twitterUsername
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Get it signed
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded-lg cursor-crosshair w-[800px] h-[600px]"
        style={{ touchAction: 'none' }}
      />
      {!twitterUsername && (
        <p className="text-red-500 text-sm">
          Please enter your Twitter username to save your pass
        </p>
      )}
    </div>
  );
}