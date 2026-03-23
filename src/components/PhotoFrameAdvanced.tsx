import React, { useState } from 'react';
import html2canvas from 'html2canvas';

const PhotoFrameAdvanced = () => {
  const [caption, setCaption] = useState('');
  const [frameStyle, setFrameStyle] = useState('classic');
  const [isEditing, setIsEditing] = useState(false);

  const saveCaption = () => {
    // Logic to save caption could go here, e.g., API call
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const downloadImage = () => {
    const element = document.getElementById('photo-frame');
    html2canvas(element).then((canvas) => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'photo-frame.png';
      link.click();
    });
  };

  return (
    <div>
      <div className={`photo-frame ${frameStyle}`} id="photo-frame">
        <img src="path_to_your_image.jpg" alt="Your Photo" />
        {isEditing ? (
          <div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Edit caption"
            />
            <button onClick={saveCaption}>Save</button>
            <button onClick={cancelEditing}>Cancel</button>
          </div>
        ) : (
          <div>
            <p>{caption}</p>
            <button onClick={() => setIsEditing(true)}>Edit Caption</button>
            <button onClick={downloadImage}>Download as PNG</button>
          </div>
        )}
      </div>
      <div>
        <button onClick={() => setFrameStyle('polaroid')}>Polaroid</button>
        <button onClick={() => setFrameStyle('classic')}>Classic</button>
        <button onClick={() => setFrameStyle('elegant')}>Elegant</button>
        <button onClick={() => setFrameStyle('modern')}>Modern</button>
      </div>
    </div>
  );
};

export default PhotoFrameAdvanced;