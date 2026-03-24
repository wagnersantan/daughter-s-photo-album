import html2canvas from "html2canvas";

const PhotoFrameAdvanced = () => {
  const capturePhoto = () => {
    const element = document.getElementById("photo-frame");

    if (element) {
      html2canvas(element).then((canvas: HTMLCanvasElement) => {
        const image = canvas.toDataURL("image/png");
        console.log(image);
      });
    }
  };

  return (
    <div>
      <div id="photo-frame">
        <h1>Foto</h1>
      </div>
      <button onClick={capturePhoto}>Capturar</button>
    </div>
  );
};

export default PhotoFrameAdvanced;