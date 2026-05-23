import confetti from 'canvas-confetti';

/**
 * Shared helper to trigger a dual corner blast (left and right sides shooting from bottom side to top side).
 * Fires multiple beautiful waves with varying angles and spreads for a rich, premium aesthetic.
 */
const triggerDualCornerBlast = (particleCount, customColors) => {
    try {
        const defaults = {
            zIndex: 9999,
            colors: customColors || ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
        };

        const fire = (particleRatio, opts) => {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(particleCount * particleRatio)
            });
        };

        // --- WAVE 1: Main powerful thrust from both bottom corners upwards and inwards ---
        // Left side shooting upwards to the right
        fire(0.25, {
            spread: 60,
            startVelocity: 65,
            origin: { x: 0, y: 0.9 },
            angle: 60
        });
        // Right side shooting upwards to the left
        fire(0.25, {
            spread: 60,
            startVelocity: 65,
            origin: { x: 1, y: 0.9 },
            angle: 120
        });

        // --- WAVE 2: Medium thrust with a wider spread shortly after (200ms) ---
        setTimeout(() => {
            // Left side wider angle
            fire(0.20, {
                spread: 70,
                startVelocity: 50,
                origin: { x: 0, y: 0.95 },
                angle: 45
            });
            // Right side wider angle
            fire(0.20, {
                spread: 70,
                startVelocity: 50,
                origin: { x: 1, y: 0.95 },
                angle: 135
            });
        }, 200);

        // --- WAVE 3: Subtle, steep velocity thrust towards the top (400ms) ---
        setTimeout(() => {
            // Left side steep angle
            fire(0.15, {
                spread: 45,
                startVelocity: 75,
                decay: 0.92,
                origin: { x: 0, y: 0.95 },
                angle: 75
            });
            // Right side steep angle
            fire(0.15, {
                spread: 45,
                startVelocity: 75,
                decay: 0.92,
                origin: { x: 1, y: 0.95 },
                angle: 105
            });
        }, 400);

    } catch (error) {
        console.error('Failed to trigger dual corner blast:', error);
    }
};

/**
 * Spectacular corner burst welcome animation for login success.
 * Shoots beautiful streams from the bottom-left and bottom-right corners towards the top-center.
 */
export const fireLoginBlast = () => {
    // Grand scale celebration for login (300 particles)
    triggerDualCornerBlast(300, ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']);
};

/**
 * Beautiful success blast for session video, MCQ, and document viewed/completed milestones.
 * Fires dual-corner streams from bottom-left and bottom-right corners upwards.
 */
export const fireSuccessBlast = () => {
    // Elegant, premium success blast for study milestones (200 particles)
    triggerDualCornerBlast(200, ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']);
};

