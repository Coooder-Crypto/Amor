"use client";

const Hero = () => {
  return (
    <div className="text-center py-8">
      <h1 className="text-6xl md:text-8xl font-bold mb-1 line-height-60">
        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-green-500">
          Hello <br />
          Amor
        </span>{" "}
        <span className="inline-block animate-wiggle">🎉</span>
      </h1>
      <div className="text-white text-opacity-50">
        Simple to Join. Smart to Vote. Easy to earn.
      </div>
    </div>
  );
};

export default Hero;
