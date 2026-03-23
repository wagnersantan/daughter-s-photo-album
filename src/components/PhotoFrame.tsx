import React, { useState } from 'react';

const PhotoFrame = () => {
    const [caption, setCaption] = useState('');

    const handleCaptionChange = (e) => {
        setCaption(e.target.value);
    };

    return (
        <div style={{ border: '5px solid #f0c', borderRadius: '10px', padding: '10px', display: 'inline-block' }}>
            <img src="https://via.placeholder.com/300" alt="frame" style={{ width: '300px', borderRadius: '10px' }} />
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <input 
                    type="text" 
                    value={caption} 
                    onChange={handleCaptionChange} 
                    placeholder="Enter caption" 
                    style={{ width: '80%', padding: '5px' }}
                />
            </div>
        </div>
    );
};

export default PhotoFrame;