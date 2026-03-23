import React, { useState } from 'react';

const PhotoFrame = ({ imageUrl }) => {
    const [caption, setCaption] = useState('');

    const handleCaptionChange = (e) => {
        setCaption(e.target.value);
    };

    const downloadImage = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'photo-frame-image.png';
        link.click();
    };

    return (
        <div className="relative flex flex-col items-center justify-center bg-gray-200 p-4 rounded-lg shadow-lg border border-gray-300">
            <img src={imageUrl} alt="Frame" className="rounded-lg" />
            <input 
                type="text" 
                value={caption} 
                onChange={handleCaptionChange} 
                className="mt-2 p-2 border rounded"
                placeholder="Edit caption..."
            />
            <button 
                onClick={downloadImage} 
                className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Download Photo
            </button>
        </div>
    );
};

export default PhotoFrame;
