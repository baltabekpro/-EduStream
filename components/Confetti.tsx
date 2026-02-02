import React, { useEffect, useState } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        if (active) {
            const colors = ['#1152d4', '#ef4444', '#eab308', '#22c55e', '#ec4899'];
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100, // vw
                y: -10, // vh
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                duration: Math.random() * 2 + 1,
                delay: Math.random() * 0.5,
                rotation: Math.random() * 360
            }));
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [active]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}vw`,
                        top: `${p.y}vh`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotation}deg)`,
                        animation: `fall ${p.duration}s linear ${p.delay}s forwards`
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    to {
                        transform: translateY(110vh) rotate(720deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Confetti;