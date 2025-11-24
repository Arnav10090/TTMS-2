import picklingsectionImg from '/picklingsection.png';

const HMI02PicklingSection = () => {
  return (
    <div className="overflow-hidden rounded-md border border-border" style={{ height: '900px' }}>
      <img
        src={picklingsectionImg}
        alt="Pickling Section Diagram"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {/* <iframe
        src="http://192.168.2.1:8080/webvisu.htm"
        title="Pickling Section Diagram"
        className="border-0"
        style={{
          width: '300%',
          height: '1400px',
          marginLeft: '-100%',
        }}
      /> */}
    </div>
  );
};

export default HMI02PicklingSection;
