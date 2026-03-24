import React from "react";

type PhotoFrameProps = {
  imageUrl: string;
};

const PhotoFrame = ({ imageUrl }: PhotoFrameProps) => {
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  return (
    <div>
      <img src={imageUrl} alt="Photo" />
      <input type="text" onChange={handleCaptionChange} />
    </div>
  );
};

export default PhotoFrame;