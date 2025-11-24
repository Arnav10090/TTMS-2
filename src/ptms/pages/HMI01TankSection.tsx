import tanksectionImg from '/tanksection.png';

const HMI01TankSection = () => {
  return (
    <div className="overflow-hidden rounded-md border border-border" style={{ height: '900px' }}>
      <img
        src={tanksectionImg}
        alt="Tank Section Diagram"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {/* <iframe
        src="http://192.168.2.1:8080/webvisu.htm"
        title="Tank Section Diagram"
        className="border-0"
        style={{
          width: '300%',
          height: '1400px',
          marginLeft: '0px',
        }}
      /> */}
    </div>
  );
};

export default HMI01TankSection;
