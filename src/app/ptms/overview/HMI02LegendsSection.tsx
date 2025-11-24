import legendsImg from '/legends.png';

const HMI02LegendsSection = () => {
  return (
    <div className="overflow-hidden rounded-md border border-border" style={{ height: '900px' }}>
      <img
        src={legendsImg}
        alt="Legends Section Diagram"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {/* <iframe
        src="http://192.168.2.1:8080/webvisu.htm"
        title="Legends Section Diagram"
        className="border-0"
        style={{
          width: '300%',
          height: '1400px',
          marginLeft: '-200%',
        }}
      /> */}
    </div>
  );
};

export default HMI02LegendsSection;
