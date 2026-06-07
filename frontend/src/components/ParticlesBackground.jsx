import { useEffect } from 'react';

export default function ParticlesBackground({ 
  id = "particles-js", 
  particleColor = "#3b82f6", 
  lineColor = "#93c5fd" 
}) {
  useEffect(() => {
    if (!document.getElementById('particles-js-script')) {
      const script = document.createElement('script');
      script.id = 'particles-js-script';
      script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
      script.async = true;
      script.onload = () => initParticles(id, particleColor, lineColor);
      document.body.appendChild(script);
    } else {
      setTimeout(() => initParticles(id, particleColor, lineColor), 100);
    }

    function initParticles(elementId, pColor, lColor) {
      if (window.particlesJS) {
        window.particlesJS(elementId, {
          particles: {
            number: { value: 40, density: { enable: true, value_area: 800 } },
            color: { value: pColor },
            shape: {
              type: "circle",
              stroke: { width: 0, color: "#000000" },
            },
            opacity: {
              value: 0.4,
              random: true,
              anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
            },
            size: {
              value: 3,
              random: true,
              anim: { enable: false, speed: 4, size_min: 0.3, sync: false }
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: lColor,
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 1.2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: { enable: false, rotateX: 600, rotateY: 600 }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "grab" },
              onclick: { enable: true, mode: "push" },
              resize: true
            },
            modes: {
              grab: { distance: 150, line_linked: { opacity: 0.6 } },
              push: { particles_nb: 3 },
            }
          },
          retina_detect: true
        });
      }
    }
  }, [id, particleColor, lineColor]);

  return (
    <div 
      id={id} 
      className="absolute inset-0 z-0 pointer-events-auto"
      style={{ backgroundColor: 'transparent' }}
    />
  );
}
